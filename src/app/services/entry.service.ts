import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EntryService {
  private apiUrl = 'http://localhost:8080/api/purchase-entries';

  constructor(private http: HttpClient) {}

  getEntriesByUserIdAndFinancialYear(userId: number, financialYear: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}?userId=${userId}&financialYear=${financialYear}`);
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
}
