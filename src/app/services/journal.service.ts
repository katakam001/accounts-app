import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { JournalEntry } from '../models/journal-entry.interface';
import { environment } from '../../environments/environment';
import { saveAs } from 'file-saver';

@Injectable({
  providedIn: 'root'
})
export class JournalService {

  exportToExcel(userId: number, financialYear: string): Observable<Blob> {
    let params = new HttpParams()
      .set('userId', userId.toString())
      .set('financialYear', financialYear);

    return this.http.get(`${this.apiUrl}/exportDaybookToExcel`, { params, responseType: 'blob' });
  }
  // private apiUrl = 'http://localhost:8080/api/journal-entries';
  private baseUrl = environment.apiUrl;
  private apiUrl = `${this.baseUrl}/api/journal-entries`; // Append the path to the base URL

  constructor(private http: HttpClient) { }

  getJournalEntriesByUserIdAndFinancialYear(userId: number, financialYear: string) {
    return this.http.get<JournalEntry[]>(`${this.apiUrl}?userId=${userId}&financialYear=${financialYear}`);
  }

  // New method to fetch combined entries for the day book
  getCombinedEntriesForDayBook(
    userId: number,
    financialYear: string,
    limit: number,
    rowCursor?: number
  ): Observable<{ entries: any[], nextRowCursor: number | null, hasNextPage: boolean }> {
    let params = new HttpParams()
      .set('userId', userId.toString())
      .set('financialYear', financialYear)
      .set('limit', limit.toString());

    if (rowCursor !== undefined) {
      params = params.set('rowCursor', rowCursor.toString());
    }

    return this.http.get<{ entries: any[], nextRowCursor: number | null, hasNextPage: boolean }>(`${this.apiUrl}/daybook`, { params });
  }

  getJournalEntriesByAccount(accountName: string, userId: number, financialYear: string): Observable<any[]> {
    return this.http.get<JournalEntry[]>(`${this.apiUrl}?userId=${userId}&financialYear=${financialYear}&accountName=${accountName}`);
  }

  getJournalEntriesByGroup(groupName: string, userId: number, financialYear: string): Observable<any[]> {
    return this.http.get<JournalEntry[]>(`${this.apiUrl}?userId=${userId}&financialYear=${financialYear}&groupName=${groupName}`);
  }

  getJournalEntriesByUserId(userId: number): Observable<JournalEntry[]> {
    return this.http.get<JournalEntry[]>(`${this.apiUrl}?userId=${userId}`);
  }

  getJournalEntryById(entryId: number): Observable<JournalEntry> {
    return this.http.get<JournalEntry>(`${this.apiUrl}/${entryId}`);
  }

  addJournalEntry(entry: JournalEntry): Observable<JournalEntry> {
    return this.http.post<JournalEntry>(this.apiUrl, entry);
  }

  updateJournalEntry(entry: JournalEntry): Observable<JournalEntry> {
    return this.http.put<JournalEntry>(`${this.apiUrl}/${entry.id}`, entry);
  }

  deleteJournalEntry(id: number): Observable<HttpResponse<void>> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { observe: 'response' });
  }

  // New method to export daybook to PDF
  exportToPDF(userId: number, financialYear: string): Observable<Blob> {
    let params = new HttpParams()
      .set('userId', userId.toString())
      .set('financialYear', financialYear);

    return this.http.get(`${this.apiUrl}/exportDaybookToPDF`, { params, responseType: 'blob' });
  }
}
