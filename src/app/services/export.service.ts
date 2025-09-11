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

  getExportsByUserIdAndFinancialYear(userId: any, financialYear: string): Observable<ExportRecord[]> {
    return this.http.get<ExportRecord[]>(`${this.apiUrl}?userId=${userId}&financialYear=${financialYear}`);
  }
}