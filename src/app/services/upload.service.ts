import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  private baseUrl = environment.apiUrl;
  private apiUrl = `${this.baseUrl}/api/upload`; // Append the path to the base URL

  constructor(private http: HttpClient) { }

  // Request Presigned URL
  getPresignedUrl(fileName: string, metadata: any) {
    const queryParams = new URLSearchParams({
      fileName,
      ...metadata // Spread metadata dynamically
    }).toString();
    return this.http.get<{ presignedUrl: string,batchId: string }>(`${this.apiUrl}/get-presigned-url?${queryParams}`);
  }

  uploadFile(file: File, presignedUrl: string) {
    const fileTypeMapping: { [key: string]: string } = {
      pdf: 'application/pdf',
      csv: 'text/csv'
    };

    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (!fileExtension || !fileTypeMapping[fileExtension]) {
      console.error('Unsupported file type:', file.type);
      return;
    }

    return this.http.put(presignedUrl, file, {
      headers: {
        'Content-Type': fileTypeMapping[fileExtension]
      },
      reportProgress: true,
      observe: 'events',
    });
  }
  startMonitoring() {
    return this.http.post(`${this.apiUrl}/start-sqs`, {}); // 🔹 No payload needed
  }

  getUploadHistory(userId: number, financialYear: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/history?userId=${userId}&financialYear=${financialYear}`);
  }

  markUploadFailure(batchId: string, errorMessage: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/mark-failure`, { batchId, errorMessage });
  }

}
