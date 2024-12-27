import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FieldService {
  private baseUrl = environment.apiUrl;
  private apiUrl = `${this.baseUrl}/api/fields`; // Append the path to the base URL

  constructor(private http: HttpClient) {}

  getAllFields(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  addField(field: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, field);
  }

  updateField(fieldId: number, field: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${fieldId}`, field);
  }

  deleteField(fieldId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${fieldId}`);
  }
}
