import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { JournalEntry } from '../models/journal-entry.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class JournalService {


  // private apiUrl = 'http://localhost:8080/api/journal-entries';
              private baseUrl = environment.apiUrl;
              private apiUrl = `${this.baseUrl}/api/journal-entries`; // Append the path to the base URL

  constructor(private http: HttpClient) {}
  
  getJournalEntriesByUserIdAndFinancialYear(userId: number, financialYear: string) {
    return this.http.get<JournalEntry[]>(`${this.apiUrl}?userId=${userId}&financialYear=${financialYear}`);
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
