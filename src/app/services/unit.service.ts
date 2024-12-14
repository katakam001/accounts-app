import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UnitService {
  private apiUrl = 'http://localhost:8080/api/units';

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
