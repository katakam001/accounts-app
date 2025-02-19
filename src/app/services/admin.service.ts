import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  private baseUrl = environment.apiUrl;
  private apiUrl = `${this.baseUrl}/api/admin`; // Append the path to the base URL

  constructor(private http: HttpClient) { }

  getUsersForAdmin(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users`);
  }
  loginAsUser(userId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login-as-user`, { userId });
  }
}
