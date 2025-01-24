import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { JournalEntry } from '../models/journal-entry.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class JournalService {


  // private apiUrl = 'http://localhost:8080/api/journal-entries';
  private baseUrl = environment.apiUrl;
  private apiUrl = `${this.baseUrl}/api/journal-entries`; // Append the path to the base URL

  constructor(private http: HttpClient) { }

  getJournalEntriesByUserIdAndFinancialYear(userId: number, financialYear: string) {
    return this.http.get<JournalEntry[]>(`${this.apiUrl}?userId=${userId}&financialYear=${financialYear}`);
  }

  // New method to fetch journal entries for the day book
  getJournalEntriesForDayBook(userId: number, financialYear: string, limit: number, cursorDate?: string, cursorId?: number): Observable<{ entries: any[], nextCursorDate: string | null, nextCursorId: number | null }> {
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
}
