import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LedgerService {
  private baseUrl = environment.apiUrl;
  private apiUrl = `${this.baseUrl}/api/ledger`; // Append the path to the base URL

  constructor(private http: HttpClient) { }

  getLedger(accountId: number, rowCursor: number, limit: number, userId: number, financialYear: string, previousBalance: number): Observable<{ ledger: any[], nextRowCursor: number, hasMoreRecords: boolean,lastBalance: number }> {
    const params = new HttpParams()
      .set('rowCursor', rowCursor.toString())
      .set('limit', limit.toString())
      .set('userId', userId.toString())
      .set('financialYear', financialYear)
      .set('previousBalance', previousBalance.toString());

    return this.http.get<{ ledger: any[], nextRowCursor: number, hasMoreRecords: boolean,lastBalance: number }>(`${this.apiUrl}/${accountId}`, { params });
  }


  getUpdatedLedger(accountId: number, startTime: string, endTime: string, last10time: Date, userId: number, financialYear: string): Observable<any[]> {
    const params = new HttpParams()
      .set('startTime', startTime)
      .set('endTime', endTime)
      .set('last10time', last10time.toISOString())
      .set('userId', userId.toString())
      .set('financialYear', financialYear);


    return this.http.get<any[]>(`${this.apiUrl}/updated/${accountId}`, { params });
  }
  exportToPDF(accountId: number, userId: number, financialYear: string): Observable<Blob> {
    const params = new HttpParams()
      .set('accountId', accountId.toString())
      .set('userId', userId.toString())
      .set('financialYear', financialYear);
  
    return this.http.get(`${this.apiUrl}/exportLedgerToPDF`, { params, responseType: 'blob' });
  }
  
  exportToExcel(accountId: number, userId: number, financialYear: string): Observable<Blob> {
    const params = new HttpParams()
      .set('accountId', accountId.toString())
      .set('userId', userId.toString())
      .set('financialYear', financialYear);
  
    return this.http.get(`${this.apiUrl}/exportLedgerToExcel`, { params, responseType: 'blob' });
  }
  
}
