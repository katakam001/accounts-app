import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductionService {
  private baseUrl = environment.apiUrl;
  private apiUrl = `${this.baseUrl}/api/production_entries`; // Append the path to the base URL

  constructor(private http: HttpClient) {}

  getEntriesByUserIdAndFinancialYear(userId: number, financialYear: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}?userId=${userId}&financialYear=${financialYear}`);
  }

  addEntry(entry: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, entry);
  }

  updateEntry(id: number, entry: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, entry);
  }

  deleteEntry(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
