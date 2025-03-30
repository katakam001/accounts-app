import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { CashEntry } from '../models/cash-entry.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CashEntriesService {

  // private apiUrl = 'http://localhost:8080/api/cash-entries';
  private baseUrl = environment.apiUrl;
  private apiUrl = `${this.baseUrl}/api/cash-entries`; // Append the path to the base URL

  constructor(private http: HttpClient) { }

  getCashEntriesByUserIdAndFinancialYear(userId: any, financialYear: string): Observable<CashEntry[]> {
    return this.http.get<CashEntry[]>(`${this.apiUrl}?userId=${userId}&financialYear=${financialYear}`);
  }

  getCashEntry(id: string): Observable<CashEntry> {
    return this.http.get<CashEntry>(`${this.apiUrl}/${id}`);
  }

  addCashEntry(cashEntry: CashEntry): Observable<CashEntry> {
    return this.http.post<CashEntry>(this.apiUrl, cashEntry);
  }

  updateCashEntry(id: string, cashEntry: CashEntry): Observable<CashEntry> {
    return this.http.put<CashEntry>(`${this.apiUrl}/${id}`, cashEntry);
  }

  deleteCashEntry(id: string): Observable<CashEntry> {
    return this.http.delete<CashEntry>(`${this.apiUrl}/${id}`);
  }
}
