import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConsolidatedStockService {

  private baseUrl = environment.apiUrl;
  private apiUrl = `${this.baseUrl}/api/consolidated_stock_register`; // Append the path to the base URL

  constructor(private http: HttpClient) { }

  getConsolidatedStockDetails(itemIds: number[], userId: number, financialYear: string): Observable<any> {
    const params = {
      itemIds: itemIds.join(','),
      userId: userId.toString(),
      financialYear: financialYear
    };
    return this.http.get<any>(this.apiUrl, { params });
  }
}
