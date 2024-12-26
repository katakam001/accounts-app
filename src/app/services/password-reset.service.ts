import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PasswordResetService {
  // private apiUrl = 'http://localhost:8080/api/auth'; // Replace with your API URL
                    private baseUrl = environment.apiUrl;
                    private apiUrl = `${this.baseUrl}/api/auth`; // Append the path to the base URL

  constructor(private http: HttpClient) {}

  sendResetEmail(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/password-reset`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/password-reset/confirm`, { token, newPassword });
  }
}
