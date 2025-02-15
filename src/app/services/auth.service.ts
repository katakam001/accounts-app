import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

const baseUrl = environment.apiUrl;
const AUTH_API = `${baseUrl}/api/auth/`;

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(
      AUTH_API + 'signin',
      {
        username,
        password,
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  register(firstname: string, middlename: string, lastname: string, username: string, email: string, password: string): Observable<any> {
    return this.http.post<any>(
      AUTH_API + 'signup',
      {
        firstname,
        middlename,
        lastname,
        username,
        email,
        password,
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  logout(): Observable<any> {
    return this.http.post(AUTH_API + 'signout', {}).pipe(
      catchError(this.handleError)
    );
  }

  refreshToken(): Observable<any> {
    return this.http.post<any>(AUTH_API + 'refresh-token', {}).pipe(
      catchError(this.handleError)
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post<any>(
      AUTH_API + 'change-password',
      {
        currentPassword,
        newPassword
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    // Customize error handling logic as needed
    console.error('An error occurred:', error);
    return throwError('Something went wrong; please try again later.');
  }
}
