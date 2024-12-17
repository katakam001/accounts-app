import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Account } from '../models/account.interface';

@Injectable({
  providedIn: 'root'
})
export class AccountService {


  private apiUrl = 'http://localhost:8080/api/accounts';

  constructor(private http: HttpClient) { }

  getAccountsByUserIdAndFinancialYear(userId: number, financialYear: string, groups?: string[]): Observable<Account[]> {
    let params = new HttpParams()
      .set('userId', userId.toString())
      .set('financialYear', financialYear);

    if (groups && groups.length > 0) {
      params = params.set('groups', groups.join(','));
    }

    return this.http.get<Account[]>(this.apiUrl, { params });
  }

  getAccountsByUserId(userId: number): Observable<Account[]> {
    return this.http.get<Account[]>(`${this.apiUrl}?userId=${userId}`);
  }
  deleteAccount(id: number): Observable<HttpResponse<void>> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { observe: 'response' });
  }

  updateAccount(account: Account): Observable<Account> {
    return this.http.put<Account>(`${this.apiUrl}/${account.id}`, account);
  }
  addAccount(account: Account): Observable<Account> {
    return this.http.post<Account>(this.apiUrl, account);
  }
}
