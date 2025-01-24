import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EntryService {
  // private apiUrl = 'http://localhost:8080/api/entries';
  private baseUrl = environment.apiUrl;
  private apiUrl = `${this.baseUrl}/api/entries`; // Append the path to the base URL

  constructor(private http: HttpClient) {}

  getEntriesByUserIdAndFinancialYearAndType(userId: number, financialYear: string, type: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}?userId=${userId}&financialYear=${financialYear}&type=${type}`);
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
  getEntryById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }
}
