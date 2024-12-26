import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// const AUTH_API = 'http://localhost:8080/api/auth/';
const baseUrl = environment.apiUrl;
const AUTH_API = `${baseUrl}/api/auth/`; // Append the path to the base URL

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<any> {
    return this.http.post(
      AUTH_API + 'signin',
      {
        username,
        password,
      },
      httpOptions
    );
  }

  register(firstname: string, middlename: string, lastname: string, username: any, email: any, password: any): Observable<any> {
    return this.http.post(
      AUTH_API + 'signup',
      {
        firstname,
        middlename,
        lastname,
        username,
        email,
        password,
      },
      httpOptions
    );
  }

  logout(): Observable<any> {
    return this.http.post(AUTH_API + 'signout', { }, httpOptions);
  }

}
