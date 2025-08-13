import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ClosingStockValuationService {

  private baseUrl = environment.apiUrl;
  private apiUrl = `${this.baseUrl}/api/closing-stock-valuation`; // Append the path to the base URL

  constructor(private http: HttpClient) { }

  getClosingStockByUserAndYear(userId: number, financialYear: string, startDate: string, endDate: string): Observable<any[]> {
    const params = {
      userId: userId.toString(),
      financialYear,
      startDate,
      endDate
    };

    return this.http.get<any[]>(this.apiUrl, { params });
  }

  updateClosingStock(stock: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${stock.id}`, stock);
  }

  generateClosingStock(userId: number, financialYear: string, startDate: string, endDate: string): Observable<any> {
    const params = {
      userId: userId.toString(),
      financialYear,
      startDate,
      endDate
    };

    return this.http.get(`${this.apiUrl}/generate`, { params });
  }
}
