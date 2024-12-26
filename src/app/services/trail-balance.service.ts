// trail-balance.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TrailBalanceService {
  // private apiUrl = 'http://localhost:8080/api/trail-balance-report';
                private baseUrl = environment.apiUrl;
                private apiUrl = `${this.baseUrl}/api/trail-balance-report`; // Append the path to the base URL

  constructor(private http: HttpClient) {}

  getTrailBalanceReport(userId: number, fromDate: string, toDate: string, financialYear: string): Observable<any> {
    const params = { userId, fromDate, toDate, financialYear };
    console.log(params);
    return this.http.post<any>(this.apiUrl, params);
  }
}
