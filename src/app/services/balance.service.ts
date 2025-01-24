import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BalanceService {
  private baseUrl = environment.apiUrl;
  private apiUrl = `${this.baseUrl}/api/balance`; // Append the path to the base URL

  constructor(private http: HttpClient) { }

  getInitialBalance(userId: number, financialYear: string): Observable<any> {
    const params = { userId: userId.toString(), financialYear };
    return this.http.get<any>(this.apiUrl, { params });
  }
}
