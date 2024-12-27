import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FieldMappingService {
  private baseUrl = environment.apiUrl;
  private apiUrl = `${this.baseUrl}/api/fieldsMapping`; // Append the path to the base URL

  constructor(private http: HttpClient) {}

  getAllFieldMappings(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getFieldMappingsByCategory(categoryId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}?category_id=${categoryId}`);
  }

  addFieldMapping(fieldMapping: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, fieldMapping);
  }

  updateFieldMapping(fieldMappingId: number, fieldMapping: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${fieldMappingId}`, fieldMapping);
  }

  deleteFieldMapping(fieldMappingId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${fieldMappingId}`);
  }
}
