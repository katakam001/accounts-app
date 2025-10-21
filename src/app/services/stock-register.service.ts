import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StockRegisterService {

  private baseUrl = environment.apiUrl;
  private apiUrl = `${this.baseUrl}/api/generate-stock-register`; // Append the path to the base URL

  constructor(private http: HttpClient) { }

  getStockRegister(financialYear: string, itemId: number, userId: number, month?: number): Observable<any> {
    let url = `${this.apiUrl}?financialYear=${financialYear}&itemId=${itemId}&userId=${userId}`;
    if (month !== undefined) {
      url += `&month=${month}`;
    }
    return this.http.get<any>(url);
  }
}
