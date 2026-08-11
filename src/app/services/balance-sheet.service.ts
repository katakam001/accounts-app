import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';



@Injectable({
  providedIn: 'root'
})
export class BalanceSheetService {

  // private apiUrl = 'http://localhost:8080/api/profit-and-loss';
  private baseUrl = environment.apiUrl;
  private apiUrl = `${this.baseUrl}/api/balance-sheet`; // Append the path to the base URL

  constructor(private http: HttpClient) { }

  getHorizontalReport(userId: number, fromDate: string, toDate: string, financialYear: string): Observable<any> {
    const params = { userId, fromDate, toDate, financialYear };
    console.log(params);
    return this.http.post<any>(`${this.apiUrl}/horizontal`, params);
  }
}
