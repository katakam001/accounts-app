import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CashEntry } from '../models/cash-entry.interface';

@Injectable({
  providedIn: 'root'
})
export class CashEntriesService {

  private apiUrl = 'http://localhost:8080/api/cash-entries';

  constructor(private http: HttpClient) {}

  getCashEntriesByUserIdAndFinancialYear(userId: any, financialYear: string): Observable<CashEntry[]> {
    return this.http.get<CashEntry[]>(`${this.apiUrl}?userId=${userId}&financialYear=${financialYear}`);
  }

  getCashEntry(id: number): Observable<CashEntry> {
    return this.http.get<CashEntry>(`${this.apiUrl}/${id}`);
  }

  addCashEntry(cashEntry: CashEntry): Observable<CashEntry> {
    return this.http.post<CashEntry>(this.apiUrl, cashEntry);
  }

  updateCashEntry(id: number, cashEntry: CashEntry): Observable<CashEntry> {
    return this.http.put<CashEntry>(`${this.apiUrl}/${id}`, cashEntry);
  }

  deleteCashEntry(id: number): Observable<CashEntry> {
    return this.http.delete<CashEntry>(`${this.apiUrl}/${id}`);
  }
}
