import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GroupMappingService {

  // private apiUrl = 'http://localhost:8080/api';
              private baseUrl = environment.apiUrl;
              private apiUrl = `${this.baseUrl}/api`; // Append the path to the base URL

  constructor(private http: HttpClient) {}

  getGroupMappingTree(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/groupMappingTree`);
  }

  addGroupMapping(group: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/addGroupMapping`, group);
  }
  updateGroupMapping(group: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/updateGroupMapping/${group.id}`, group);
  }

  deleteGroupMapping(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/deleteGroupMapping/${id}`);
  }

}