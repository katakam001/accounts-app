import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Group } from '../models/group.interface';
import { environment } from '../../environments/environment';

const GROUPS_KEY = 'cached-groups';
const LAST_CACHE_TIME_KEY = 'last-cache-time-groups';

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private baseUrl = environment.apiUrl;
  private apiUrl = `${this.baseUrl}/api/groups`; // Append the path to the base URL
  private cacheTTL = environment.cacheTTL; // 1 day in milliseconds
  private lastCacheTime: number = this.getLastCacheTime();
  private groupCache: Group[] = this.loadFromLocalStorage(); // Cache for groups

  constructor(private http: HttpClient) {}

  getGroupsByUserIdAndFinancialYear(userId: number, financialYear: string): Observable<Group[]> {
    const currentTime = Date.now();
    let params = new HttpParams()
      .set('userId', userId.toString())
      .set('financialYear', financialYear);

    if (this.groupCache.length > 0 && (currentTime - this.lastCacheTime) < this.cacheTTL) {
      return of(this.groupCache);
    } else {
      this.clearCacheIfStale(currentTime);
      return this.http.get<Group[]>(this.apiUrl, { params }).pipe(
        tap(data => {
          this.groupCache = data;
          this.lastCacheTime = currentTime;
          this.saveToLocalStorage();
        }),
        catchError(this.handleError<Group[]>('getGroupsByUserIdAndFinancialYear', []))
      );
    }
  }

  addGroup(group: Group): Observable<Group> {
    return this.http.post<Group>(this.apiUrl, group).pipe(
      tap(newGroup => {
        this.groupCache = [...this.groupCache, newGroup];
        this.saveToLocalStorage();
      }),
      catchError(this.handleError<Group>('addGroup'))
    );
  }

  updateGroup(group: Group): Observable<Group> {
    return this.http.put<Group>(`${this.apiUrl}/${group.id}`, group).pipe(
      tap(updatedGroup => {
        const index = this.groupCache.findIndex(g => g.id === group.id);
        if (index !== -1) {
          this.groupCache[index] = updatedGroup;
          this.saveToLocalStorage();
        }
      }),
      catchError(this.handleError<Group>('updateGroup'))
    );
  }

  deleteGroup(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.groupCache = this.groupCache.filter(g => g.id !== id);
        this.saveToLocalStorage();
      }),
      catchError((error: any) => {
        if (error.error && error.error.message && error.error.message.includes('delete group')) {
          // Handle duplicate error specifically
          if (error.error.detail.includes('journal_items'))
            return throwError(() => new Error('Group deletion failed: This group is associated with existing journal entries. Please remove or reassign the journal entries linked to this group before attempting deletion.'));
          else if (error.error.detail.includes('cash_entries'))
            return throwError(() => new Error('Group deletion failed: This group is associated with existing cash entries. Please remove or reassign the cash entries linked to this group before attempting deletion.'));
          else
            return throwError(() => new Error(error.error.detail)); // Re-throw error if needed
        } else {
          // Handle other errors
          return throwError(() => new Error('Failed to delete group. Please try again later.'));
        }
      })
    );
  }

  clearCache(): void {
    this.groupCache = []; // Clear group cache
    this.lastCacheTime = 0;
    this.saveToLocalStorage();
  }

  switchUserAndFinancialYear(userId: number, financialYear: string): Observable<any> {
    this.clearCache();
    return this.getGroupsByUserIdAndFinancialYear(userId, financialYear);
  }  

  private clearCacheIfStale(currentTime: number): void {
    if ((currentTime - this.lastCacheTime) >= this.cacheTTL) {
      this.clearCache();
    }
  }

  private loadFromLocalStorage(): Group[] {
    const groups = localStorage.getItem(GROUPS_KEY);
    return groups ? JSON.parse(groups) : [];
  }

  private saveToLocalStorage(): void {
    localStorage.setItem(GROUPS_KEY, JSON.stringify(this.groupCache));
    localStorage.setItem(LAST_CACHE_TIME_KEY, this.lastCacheTime.toString());
  }

  private getLastCacheTime(): number {
    const lastCacheTime = localStorage.getItem(LAST_CACHE_TIME_KEY);
    return lastCacheTime ? parseInt(lastCacheTime, 10) : 0;
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      return of(result as T);
    };
  }
}
