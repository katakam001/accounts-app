import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ExportRecord } from '../models/export.interface';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ExportService {

  private baseUrl = environment.apiUrl;
  private apiUrl = `${this.baseUrl}/api/exports`; // Append the path to the base URL

  constructor(private http: HttpClient) { }

  getExportsByUserIdAndFinancialYear(userId: any, fromDate: string, toDate: string, financialYear: string): Observable<ExportRecord[]> {
    let params = new HttpParams()
      .set('userId', userId.toString())
      .set('financialYear', financialYear)
    // Add fromDate and toDate to the params if they are provided
    if (fromDate) {
      params = params.set('fromDate', fromDate); // Use ISO string format
    }
    if (toDate) {
      params = params.set('toDate', toDate); // Use ISO string format
    }
    return this.http.get<ExportRecord[]>(`${this.apiUrl}`, { params });
  }
}