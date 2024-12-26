import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UnitService {
  // private apiUrl = 'http://localhost:8080/api/units';
                  private baseUrl = environment.apiUrl;
                  private apiUrl = `${this.baseUrl}/api/units`; // Append the path to the base URL

  constructor(private http: HttpClient) {}

  getUnits(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  addUnit(unit: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, unit);
  }

  updateUnit(unitId: number, unit: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${unitId}`, unit);
  }

  deleteUnit(unitId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${unitId}`);
  }
}
