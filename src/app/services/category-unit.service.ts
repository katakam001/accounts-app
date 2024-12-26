import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CategoryUnitService {
  // private apiUrl = 'http://localhost:8080/api/category-units';
      private baseUrl = environment.apiUrl;
      private apiUrl = `${this.baseUrl}/api/category-units`; // Append the path to the base URL

  constructor(private http: HttpClient) {}

  getCategoryUnits(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getUnitsByCategory(categoryId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}?category_id=${categoryId}`);
  }
  
  addCategoryUnit(categoryUnit: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, categoryUnit);
  }

  updateCategoryUnit(categoryUnitId: number, categoryUnit: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${categoryUnitId}`, categoryUnit);
  }

  deleteCategoryUnit(categoryUnitId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${categoryUnitId}`);
  }
}
