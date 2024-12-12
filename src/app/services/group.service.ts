import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Group } from '../models/group.interface';

@Injectable({
  providedIn: 'root'
})
export class GroupService {

  private apiUrl = 'http://localhost:8080/api/groups';

  constructor(private http: HttpClient) {}
  
  getGroupsByUserIdAndFinancialYear(userId: number, financialYear: string) {
    return this.http.get<Group[]>(`${this.apiUrl}?userId=${userId}&financialYear=${financialYear}`);
  }

  getGroupsByUserId(userId: number): Observable<Group[]> {
    return this.http.get<Group[]>(`${this.apiUrl}?userId=${userId}`);
  }

  addGroup(group: Group): Observable<Group> {
    return this.http.post<Group>(this.apiUrl, group);
  }

  updateGroup(group: Group): Observable<Group> {
    return this.http.put<Group>(`${this.apiUrl}/${group.id}`, group);
  }

  deleteGroup(id: number): Observable<HttpResponse<void>> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { observe: 'response' });
  }
}
