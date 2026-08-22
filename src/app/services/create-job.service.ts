import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CreateJobService {
  private baseUrl = environment.apiUrl;
  private apiUrl = `${this.baseUrl}/api/admin/jobs`; // Base path for admin jobs

  constructor(private http: HttpClient) { }

  // Create a new job
  createJob(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/create`, payload);
  }

  // Get all jobs for the admin
  getJobsByAdmin(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // ✅ Drill-down: tables for a given job
  getJobTables(jobId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${jobId}/tables`);
  }

  // ✅ Drill-down: chunks for a given table
  getJobChunks(tableId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/tables/${tableId}/chunks`);
  }

  // Retry a failed job (dummy for now, wire later)
  retryJob(jobId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${jobId}/retry`, {});
  }

  // Trigger ledger job for a copy job
  triggerLedgerJob(jobId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${jobId}/ledger`, {});
  }

}
