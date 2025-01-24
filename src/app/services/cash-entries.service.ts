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

  // New method to fetch cash entries for the day book
  getCashEntriesForDayBook(userId: number, financialYear: string, limit: number, cursorDate?: string, cursorId?: number): Observable<{ entries: any[], nextCursorDate: string | null, nextCursorId: number | null }> {
    let params = new HttpParams()
      .set('userId', userId.toString())
      .set('financialYear', financialYear)
      .set('limit', limit.toString());
  
    if (cursorDate) {
      params = params.set('cursorDate', cursorDate);
    }
    if (cursorId) {
      params = params.set('cursorId', cursorId.toString());
    }
  
    return this.http.get<{ entries: any[], nextCursorDate: string | null, nextCursorId: number | null }>(`${this.apiUrl}/daybook`, { params }).pipe(
      map((response: { entries: any[], nextCursorDate: string | null, nextCursorId: number | null }) => ({
        entries: response.entries,
        nextCursorDate: response.nextCursorDate,
        nextCursorId: response.nextCursorId
      }))
    );
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
