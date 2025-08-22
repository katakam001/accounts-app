import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable,  throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
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

  getJournalEntriesByUserIdAndFinancialYear(userId: number, financialYear: string,nextStartRow:number, pageSize:number, fromDate?: string, toDate?: string): Observable<{ journalEntries: any[], nextStartRow: number, hasMore: boolean }> {
    let params = new HttpParams()
    .set('userId', userId.toString())
    .set('financialYear', financialYear)
    .set('pageSize', pageSize.toString())
    .set('nextStartRow', nextStartRow.toString());
        // Add fromDate and toDate to the params if they are provided
    if (fromDate) {
      params = params.set('fromDate', fromDate); // Use ISO string format
    }
    if (toDate) {
      params = params.set('toDate', toDate); // Use ISO string format
    }
    return this.http.get<{ journalEntries: any[], nextStartRow: number, hasMore: boolean }>(`${this.apiUrl}`, { params });
  }

  // New method to fetch combined entries for the day book
  getCombinedEntriesForDayBook(
    userId: number,
    financialYear: string,
    limit: number,
    selectedTypes: number[], // Pass selected types explicitly
    rowCursor?: number,
    fromDate?: string, toDate?: string,
  ): Observable<{ entries: any[], nextRowCursor: number | null, hasNextPage: boolean }> {
    let params = new HttpParams()
      .set('userId', userId.toString())
      .set('financialYear', financialYear)
      .set('limit', limit.toString())
      .set('selectedTypes', selectedTypes.join(',')); // Convert array to comma-separated string

    if (rowCursor !== undefined) {
      params = params.set('rowCursor', rowCursor.toString());
    }
    // Add fromDate and toDate to the params if they are provided
    if (fromDate) {
      params = params.set('fromDate', fromDate); // Use ISO string format
    }
    if (toDate) {
      params = params.set('toDate', toDate); // Use ISO string format
    }

    return this.http.get<{ entries: any[], nextRowCursor: number | null, hasNextPage: boolean }>(`${this.apiUrl}/daybook`, { params });
  }

  getJournalEntriesByAccount(accountId: number, userId: number, financialYear: string,nextStartRow:number, pageSize:number): Observable<{ journalEntries: any[], nextStartRow: number, hasMore: boolean }> {
    let params = new HttpParams()
    .set('userId', userId.toString())
    .set('financialYear', financialYear)
    .set('accountId',accountId.toString())
    .set('pageSize', pageSize.toString())
    .set('nextStartRow', nextStartRow.toString());
    return this.http.get<{ journalEntries: any[], nextStartRow: number, hasMore: boolean }>(`${this.apiUrl}`, { params });
  }

  getJournalEntriesByGroup(groupId: number, userId: number, financialYear: string,nextStartRow:number, pageSize:number): Observable<{ journalEntries: any[], nextStartRow: number, hasMore: boolean }> {
    let params = new HttpParams()
    .set('userId', userId.toString())
    .set('financialYear', financialYear)
    .set('groupId',groupId.toString())
    .set('pageSize', pageSize.toString())
    .set('nextStartRow', nextStartRow.toString());
    return this.http.get<{ journalEntries: any[], nextStartRow: number, hasMore: boolean }>(`${this.apiUrl}`, { params });
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
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { observe: 'response' })
      .pipe(
        map(response => {
          // Handle the successful 204 response (it contains no content)
          if (response.status === 204) {
            return response;
          }
          return response; // Default case for other successful responses (if any)
        }),
        catchError((error: any) => {
          if (error.error && error.error.message && error.error.message.includes('delete journal')) {
            // Handle duplicate error specifically
            if (error.error.detail.includes('entries'))
              return throwError(() => new Error('journal entries deletion failed: This journal entries is associated with existing invoices. Please remove or reassign the invoices linked to this journal entries before attempting deletion.'));
            else
              return throwError(() => new Error(error.error.detail)); // Re-throw error if needed
          } else {
            // Handle other errors
            return throwError(() => new Error('Failed to delete group. Please try again later.'));
          }
        })
      );
  }

  // New method to export daybook to PDF
  exportToPDF(userId: number, financialYear: string): Observable<Blob> {
    let params = new HttpParams()
      .set('userId', userId.toString())
      .set('financialYear', financialYear);

    return this.http.get(`${this.apiUrl}/exportDaybookToPDF`, { params, responseType: 'blob' });
  }
}
