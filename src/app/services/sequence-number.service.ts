import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SequenceNumberService {
  private baseUrl = environment.apiUrl;
  private apiUrl = `${this.baseUrl}/api/seqNo`; // Append the path to the base URL
  constructor(private http: HttpClient) { }

  getInvoicesNo(userId: number, financialYear: string, type: number): Observable<any> {
      const params = { userId: userId.toString(), financialYear,type:type.toString() };
      return this.http.get<any>(`${this.apiUrl}/getInvoicesNo`, { params });
    }
}
