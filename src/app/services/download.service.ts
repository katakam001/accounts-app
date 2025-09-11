import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DownloadService {

  private baseUrl = environment.apiUrl;
  private apiUrl = `${this.baseUrl}/api/download`; // Append the path to the base URL

  constructor(private http: HttpClient) { }

  // Request Presigned URL
  getPresignedUrl(outputKey: string) {
    const queryParams = new URLSearchParams({
      outputKey
    }).toString();
    return this.http.get<{ presignedUrl: string }>(`${this.apiUrl}/get-presigned-url?${queryParams}`);
  }
}