import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FieldService {
  private apiUrl = 'http://localhost:8080/api/purchase-fields';

  constructor(private http: HttpClient) {}

  getAllFields(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getFieldsByCategory(categoryId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}?category_id=${categoryId}`);
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
