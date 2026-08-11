// trail-balance.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TrailBalanceService {
  // private apiUrl = 'http://localhost:8080/api/trail-balance-report';
                private baseUrl = environment.apiUrl;
                private apiUrl = `${this.baseUrl}/api/trail-balance`; // Append the path to the base URL

  constructor(private http: HttpClient) {}

  getTrailBalanceReport(userId: number, fromDate: string, toDate: string, financialYear: string): Observable<any> {
    const params = { userId, fromDate, toDate,financialYear };
    console.log(params);
    return this.http.post<any>(`${this.apiUrl}/report`, params);
  }

    exportTrailBalanceToPDF(userId: number, financialYear: string, companyName: string, city: string, fromDate?: string, toDate?: string): Observable<any> {
      let params = new HttpParams()
        .set('userId', userId.toString())
        .set('financialYear', financialYear)
        .set('companyName', companyName)
        .set('city', city);
      // Add fromDate and toDate to the params if they are provided
      if (fromDate) {
        params = params.set('fromDate', fromDate); // Use ISO string format
      }
      if (toDate) {
        params = params.set('toDate', toDate); // Use ISO string format
      }
      return this.http.get(`${this.apiUrl}/export-trail-balance-to-pdf`, { params });
    }
    getAccountsForGroup(groupId: number , userId: number, fromDate: string, toDate: string, financialYear: string): Observable<any> {
    const params = { groupId,userId, fromDate, toDate,financialYear };
    console.log(params);
    return this.http.post<any>(`${this.apiUrl}/accounts-to-group`, params);
  }
}
