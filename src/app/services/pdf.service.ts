import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PdfService {
    private baseUrl = environment.apiUrl;
    private apiUrl = `${this.baseUrl}/api/upload`; // Append the path to the base URL

  constructor(private http: HttpClient) {}

  uploadPdf(file: File, statementType: string, bankName: string, account_id: string,userId:number,financialYear:string): Observable<any> {
    const formData = new FormData();
  
    // Append the file
    formData.append('pdf', file);
  
    // Append additional parameters
    formData.append('statementType', statementType);
    formData.append('bankName', bankName);
    formData.append('accountId', account_id);
    formData.append('userId', userId.toString())
    formData.append('financialYear', financialYear);
  
    // Send the POST request with all data
    return this.http.post(`${this.apiUrl}/bank-statement-pdf`, formData, {
      reportProgress: true,
      observe: 'events',
    });
  }
  uploadExcelFile(file: File,userId:number,financialYear:string): Observable<any> {
    const formData = new FormData();
    // Append the file
    formData.append('file', file);
  
    // Append additional parameters
    formData.append('userId', userId.toString())
    formData.append('financialYear', financialYear);
  
    // Send the POST request with all data
    return this.http.post(`${this.apiUrl}/entries-upload`, formData, {
      reportProgress: true,
      observe: 'events',
    });
  }
  validateExcelFile(file: File, userId: number, financialYear: string): Observable<Blob> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId.toString());
    formData.append('financialYear', financialYear);
  
    // Send the file to the backend, expecting a Blob response
    return this.http.post(`${this.apiUrl}/validate-entries-upload`, formData, { responseType: 'blob' });
  }
  
}
