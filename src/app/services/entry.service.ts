import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EntryService {
  // private apiUrl = 'http://localhost:8080/api/entries';
  private baseUrl = environment.apiUrl;
  private apiUrl = `${this.baseUrl}/api/entries`; // Append the path to the base URL

  constructor(private http: HttpClient) { }

  getEntriesByUserIdAndFinancialYearAndType(userId: number, financialYear: string, type: number, nextStartRow: number, pageSize: number, fromDate?: string, toDate?: string): Observable<{ entries: any[], nextStartRow: number, hasMore: boolean }> {
    let params = new HttpParams()
      .set('userId', userId.toString())
      .set('financialYear', financialYear)
      .set('type', type.toString())
      .set('pageSize', pageSize.toString())
      .set('nextStartRow', nextStartRow.toString());
    // Add fromDate and toDate to the params if they are provided
    if (fromDate) {
      params = params.set('fromDate', fromDate); // Use ISO string format
    }
    if (toDate) {
      params = params.set('toDate', toDate); // Use ISO string format
    }
    return this.http.get<{ entries: any[], nextStartRow: number, hasMore: boolean }>(`${this.apiUrl}`, { params });
  }
  // Method to call getTaxSummary
  getTaxSummary(userId: number, financialYear: string, type: number,fromDate?: string, toDate?: string ): Observable<any> {
    let params = new HttpParams()
      .set('userId', userId.toString())
      .set('financialYear', financialYear)
      .set('type', type.toString());
    // Add fromDate and toDate to the params if they are provided
    if (fromDate) {
      params = params.set('fromDate', fromDate); // Use ISO string format
    }
    if (toDate) {
      params = params.set('toDate', toDate); // Use ISO string format
    }
    return this.http.get(`${this.apiUrl}/getTaxSummary`, { params });
  }
  getEntryTypeSummary (userId: number, financialYear: string, fromDate?: string, toDate?: string ): Observable<any> {
    let params = new HttpParams()
      .set('userId', userId.toString())
      .set('financialYear', financialYear)
    // Add fromDate and toDate to the params if they are provided
    if (fromDate) {
      params = params.set('fromDate', fromDate); // Use ISO string format
    }
    if (toDate) {
      params = params.set('toDate', toDate); // Use ISO string format
    }
    return this.http.get(`${this.apiUrl}/getEntryTypeSummary`, { params });
  }

  addEntry(entry: any, dynamicFields: any[]): Observable<any> {
    return this.http.post<any>(this.apiUrl, { entry, dynamicFields });
  }

  updateEntry(id: number, entry: any, dynamicFields: any[]): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, { entry, dynamicFields });
  }

  deleteEntry(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  // New method to fetch an entry by ID
  getEntriesByInvoiceSeqId(invoice_seq_id: number, type: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${invoice_seq_id}/${type}`);
  }
  // New method to add multiple entries
  addEntries(entries: any[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/bulk`, { entries });
  }

  // New method to update multiple entries
  updateEntries(entries: any[]): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/bulk`, { entries });
  }

  deleteEntries(invoice_seq_id: number, type: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${invoice_seq_id}/${type}`);
  }  
}
