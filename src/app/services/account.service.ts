import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap, map, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { Account } from '../models/account.interface';

const ACCOUNTS_KEY = 'cached-accounts';
const LAST_CACHE_TIME_KEY = 'last-cache-time';
const TOTAL_ACCOUNTS_COUNT_KEY = 'total-accounts-count';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private baseUrl = environment.apiUrl;
  private apiUrl = `${this.baseUrl}/api/accounts`; // Append the path to the base URL
  private cacheTTL = environment.cacheTTL; // 1 day in milliseconds
  private cacheCapacity = environment.accountCacheCapacity; // Cache capacity

  constructor(private http: HttpClient, private dbService: NgxIndexedDBService) {}

  getAccountsByUserIdAndFinancialYear(userId: number, financialYear: string, groups?: string[]): Observable<Account[]> {
    const currentTime = Date.now();
    this.clearCacheIfStale(currentTime); // Ensure cache is fresh

    // Retrieve cached accounts from localStorage
    let cachedAccounts = this.getCachedAccounts();
    let filteredAccounts = cachedAccounts;

    if (groups && groups.length > 0) {
      filteredAccounts = cachedAccounts.filter(account => account.group && groups.includes(account.group.name));
    }

    // Fetch the remaining accounts from IndexedDB
    return this.dbService.getAll('accounts').pipe(
      map((dbAccounts: unknown[]) => {
        let accounts = dbAccounts as Account[];
        if (groups && groups.length > 0) {
          accounts = accounts.filter(account => account.group && groups.includes(account.group.name));
        }

        // Combine the cached accounts with the remaining accounts from IndexedDB
        const combinedAccounts = [...filteredAccounts, ...accounts];
        return combinedAccounts;
      }),
      switchMap((combinedAccounts: Account[]) => {
        let totalAccountsCount = this.getTotalAccountsCount();
        if (groups && groups.length > 0) {
          totalAccountsCount = combinedAccounts.filter(account => account.group && groups.includes(account.group.name)).length;
        }
        if (combinedAccounts.length < totalAccountsCount || totalAccountsCount == 0) {
          return this.fetchAccountsFromServer(userId, financialYear, groups, combinedAccounts);
        }
        return of(combinedAccounts);
      }),
      catchError((error: any) => {
        console.error('Error fetching accounts from DB:', error);
        return this.fetchAccountsFromServer(userId, financialYear, groups, filteredAccounts);
      })
    );
  }

  getAccount(userId: number, financialYear: string,name?: string, id?: number): Observable<Account | undefined> {
    // First, try to fetch the account from the in-memory cache
    const cachedAccounts = this.getCachedAccounts();
    const cachedAccount = name
      ? cachedAccounts.find(account => account.name === name)
      : cachedAccounts.find(account => account.id === id);

    if (cachedAccount) {
      // If the account is found in the in-memory cache, return it
      return of(cachedAccount);
    }

    // If the account is not found in the in-memory cache, try to fetch it from IndexedDB
    const dbObservable = name
      ? this.dbService.getAll('accounts').pipe(
          map((accounts: unknown[]) => accounts as Account[]), // Assert the type to Account[]
          map((accounts: Account[]) => accounts.find(account => account.name === name))
        )
      : this.dbService.getByKey<Account>('accounts', id!);

    return dbObservable.pipe(
      switchMap((account: Account | undefined) => {
        if (account) {
          // If the account is found in IndexedDB, return it
          return of(account);
        } else {
          // If the account is not found in IndexedDB, fetch it from the server
          const params = new HttpParams()
            .set('userId', userId.toString())
            .set('financialYear', financialYear);

          const url = name ? `${this.apiUrl}/name/${name}` : `${this.apiUrl}/${id}`;

          return this.http.get<Account>(url, { params }).pipe(
            tap((fetchedAccount: Account) => {
              const cachedAccounts = this.getCachedAccounts();
              let lastAccount: Account | undefined = undefined;

              // Check if the cache exceeds the capacity
              if (cachedAccounts.length + 1 > this.cacheCapacity) {
                lastAccount = cachedAccounts.pop(); // Remove the last account
              }

              cachedAccounts.push(fetchedAccount); // Push the new account to the last index
              this.setCachedAccounts(cachedAccounts);
              // Increment totalAccountsCount by 1
              this.setTotalAccountsCount(this.getTotalAccountsCount() + 1);

              if (lastAccount) {
                this.dbService.getByKey('accounts', lastAccount.id).subscribe(existingAccount => {
                  if (existingAccount) {
                    this.dbService.update('accounts', lastAccount).subscribe({
                      next: () => console.log('Account updated in IndexedDB:', lastAccount),
                      error: (error: any) => console.error('Error updating account in IndexedDB:', error)
                    });
                  } else {
                    this.dbService.add('accounts', lastAccount).subscribe({
                      next: () => console.log('Account added to IndexedDB:', lastAccount),
                      error: (error: any) => console.error('Error adding account to IndexedDB:', error)
                    });
                  }
                });
              }
            }),
            catchError(this.handleError<Account>('getAccount'))
          );
        }
      }),
      catchError(this.handleError<Account>('getAccount'))
    );
  }
  
  private fetchAccountsFromServer(userId: number, financialYear: string, groups: string[] | undefined, cachedAccounts: Account[]): Observable<Account[]> {
    let params = new HttpParams()
      .set('userId', userId.toString())
      .set('financialYear', financialYear);

    if (groups && groups.length > 0) {
      params = params.set('groups', groups.join(','));
    }

    return this.http.get<Account[]>(this.apiUrl, { params }).pipe(
      tap((apiData: Account[]) => {
        const newAccounts = this.addToCache(apiData, Date.now());
        newAccounts.forEach((account: Account) => {
          this.dbService.getByKey('accounts', account.id).subscribe(existingAccount => {
            if (existingAccount) {
              this.dbService.update('accounts', account).subscribe({
                next: () => console.log('Account updated in IndexedDB:', account),
                error: (error: any) => console.error('Error updating account in IndexedDB:', error)
              });
            } else {
              this.dbService.add('accounts', account).subscribe({
                next: () => console.log('Account added to IndexedDB:', account),
                error: (error: any) => console.error('Error adding account to IndexedDB:', error)
              });
            }
          });
        });
      }),
      map((apiData: Account[]) => {
        if (groups && groups.length > 0) {
          apiData = apiData.filter(account => account.group && groups.includes(account.group.name));
        }

        const remainingAccounts = apiData.filter(account => !cachedAccounts.some(cachedAccount => cachedAccount.id === account.id));
        return [...cachedAccounts, ...remainingAccounts];
      }),
      catchError((error: any) => {
        console.error('Error fetching accounts from API:', error);
        return of([]);
      })
    );
  }

  private addToCache(data: Account[], currentTime: number): Account[] {
    // Retrieve cached accounts from localStorage
    const cachedAccounts = this.getCachedAccounts();
    const accountIds = new Set(cachedAccounts.map(account => account.id));
    const newAccounts = data.filter(account => !accountIds.has(account.id));

    const combinedAccounts = [...cachedAccounts, ...newAccounts];
    if (this.getTotalAccountsCount() == 0) {
      this.setTotalAccountsCount(combinedAccounts.length);
    }
    if (combinedAccounts.length > this.cacheCapacity) {
      this.setCachedAccounts(combinedAccounts.slice(-this.cacheCapacity));
    } else {
      this.setCachedAccounts(combinedAccounts);
    }

    this.setLastCacheTime(currentTime);
    if (newAccounts.length == this.getTotalAccountsCount()) {
      const accountIds = new Set(this.getCachedAccounts().map(account => account.id));
      return newAccounts.filter(account => !accountIds.has(account.id));
    }
    return newAccounts;
  }

  private clearCacheIfStale(currentTime: number): void {
    const lastCacheTime = this.getLastCacheTime();
    if ((currentTime - lastCacheTime) >= this.cacheTTL) {
      this.clearCache();
    }
  }

  clearCache(): void {
    this.setCachedAccounts([]);
    this.setLastCacheTime(0);
    this.setTotalAccountsCount(0);

    this.dbService.clear('accounts').subscribe({
      next: () => console.log('IndexedDB accounts store cleared'),
      error: (error: any) => console.error('Error clearing IndexedDB accounts store:', error)
    });
  }
  private getCachedAccounts(): Account[] {
    const accounts = localStorage.getItem(ACCOUNTS_KEY);
    return accounts ? JSON.parse(accounts) : [];
  }

  private setCachedAccounts(accounts: Account[]): void {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  }

  private getLastCacheTime(): number {
    const lastCacheTime = localStorage.getItem(LAST_CACHE_TIME_KEY);
    return lastCacheTime ? parseInt(lastCacheTime, 10) : 0;
  }

  private setLastCacheTime(time: number): void {
    localStorage.setItem(LAST_CACHE_TIME_KEY, time.toString());
  }

  private getTotalAccountsCount(): number {
    const totalAccountsCount = localStorage.getItem(TOTAL_ACCOUNTS_COUNT_KEY);
    return totalAccountsCount ? parseInt(totalAccountsCount, 10) : 0;
  }

  private setTotalAccountsCount(count: number): void {
    localStorage.setItem(TOTAL_ACCOUNTS_COUNT_KEY, count.toString());
  }

  addAccount(account: Account): Observable<Account> {
    return this.http.post<Account>(this.apiUrl, account).pipe(
      tap((newAccount: Account) => {
        const cachedAccounts = this.getCachedAccounts();
        let lastAccount: Account | undefined = undefined;
        
        // Check if the cache exceeds the capacity
        if (cachedAccounts.length + 1 > this.cacheCapacity) {
          lastAccount = cachedAccounts.pop(); // Remove the last account
  
        // Evict cache if needed
        // this.evictCacheIfNeeded();
      }
        cachedAccounts.push(newAccount); // Push the new account to the last index
        this.setCachedAccounts(cachedAccounts);
        // Increment totalAccountsCount by 1
        this.setTotalAccountsCount(this.getTotalAccountsCount() + 1);    


      if (lastAccount) {
        this.dbService.getByKey('accounts', lastAccount.id).subscribe(existingAccount => {
          if (existingAccount) {
            this.dbService.update('accounts', lastAccount).subscribe({
              next: () => console.log('Account updated in IndexedDB:', lastAccount),
              error: (error: any) => console.error('Error updating account in IndexedDB:', error)
            });
          } else {
            this.dbService.add('accounts', lastAccount).subscribe({
              next: () => console.log('Account added to IndexedDB:', lastAccount),
              error: (error: any) => console.error('Error adding account to IndexedDB:', error)
            });
          }
        });
      }

      }),
    // Improved error handling
    catchError((error: any) => {
      if (error.error && error.error.message && error.error.message.includes('already exists')) {
        // Handle duplicate error specifically
        return throwError(() => new Error(error.error.message)); // Re-throw error if needed
      } else {
        // Handle other errors
        return throwError(() => new Error('Failed to add account. Please try again later.'));
      }
    })
    );
  }

  deleteAccount(id: number): Observable<HttpResponse<void>> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { observe: 'response' }).pipe(
      tap(() => {
        const cachedAccounts = this.getCachedAccounts();
        const updatedAccounts = cachedAccounts.filter(a => a.id !== id);
        this.setCachedAccounts(updatedAccounts);
        this.setTotalAccountsCount(this.getTotalAccountsCount() - 1);


        this.dbService.delete('accounts', id).subscribe({
          next: () => console.log('Account deleted from IndexedDB:', id),
          error: (error: any) => console.error('Error deleting account from IndexedDB:', error)
        });

        // Decrement totalAccountsCount by 1
      }),
      catchError((error: any) => {
        if (error.error && error.error.message && error.error.message.includes('delete account')) {
          // Handle duplicate error specifically
          if (error.error.detail.includes('journal_items'))
            return throwError(() => new Error('Account deletion failed: This account is associated with existing journal entries. Please remove or reassign the journal entries linked to this account before attempting deletion.'));
          else if (error.error.detail.includes('cash_entries'))
            return throwError(() => new Error('Account deletion failed: This account is associated with existing cash entries. Please remove or reassign the cash entries linked to this account before attempting deletion.'));
          else if (error.error.detail.includes('entries'))
            return throwError(() => new Error('Account deletion failed: This account is associated with existing invoices. Please remove or reassign the invoices linked to this account before attempting deletion.'));
          else if (error.error.detail.includes('fields_mapping'))
            return throwError(() => new Error('Account deletion failed: This account is associated with existing field mappping as tax account. Please remove or reassign the field mapping linked to this tax account before attempting deletion.'));
          else
            return throwError(() => new Error(error.error.detail)); // Re-throw error if needed
        } else {
          // Handle other errors
          return throwError(() => new Error('Failed to delete account. Please try again later.'));
        }
      })
    );
  }

  updateAccount(account: Account): Observable<Account> {
    return this.http.put<Account>(`${this.apiUrl}/${account.id}`, account).pipe(
      tap((updatedAccount: Account) => {
        const cachedAccounts = this.getCachedAccounts();
        const index = cachedAccounts.findIndex(a => a.id === account.id);
        if (index !== -1) {
          cachedAccounts[index] = updatedAccount;
          this.setCachedAccounts(cachedAccounts);
        }else{
          this.dbService.update('accounts', updatedAccount).subscribe({
            next: () => console.log('Account updated in IndexedDB:', updatedAccount),
            error: (error: any) => console.error('Error updating account in IndexedDB:', error)
          });
        }
      }),
      catchError((error: any) => {
        if (error.error && error.error.message && error.error.message.includes('already exists')) {
          // Handle duplicate error specifically
          return throwError(() => new Error(error.error.message)); // Re-throw error if needed
        } else {
          // Handle other errors
          return throwError(() => new Error('Failed to update account. Please try again later.'));
        }
      })    
    );
  }

  switchUserAndFinancialYear(userId: number, financialYear: string): Observable<any> {
    this.clearCache();
    return this.getAccountsByUserIdAndFinancialYear(userId, financialYear);
  }

  private evictCacheIfNeeded(): void {
    const cachedAccounts = this.getCachedAccounts();
    if (cachedAccounts.length > this.cacheCapacity) {
      this.setCachedAccounts(cachedAccounts.slice(-this.cacheCapacity));
    }
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      return of(result as T);
    };
  }
}
