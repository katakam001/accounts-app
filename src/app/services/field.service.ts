import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

const FIELDS_KEY = 'cached-fields';
const LAST_CACHE_TIME_KEY = 'last-cache-time-fields';

@Injectable({
  providedIn: 'root'
})
export class FieldService {
  private baseUrl = environment.apiUrl;
  private apiUrl = `${this.baseUrl}/api/fields`; // Append the path to the base URL
  private cacheTTL = environment.cacheTTL; // 1 day in milliseconds
  private lastCacheTime: number = this.getLastCacheTime();
  private fieldCache: any[] = this.loadFromLocalStorage(); // Cache for fields

  constructor(private http: HttpClient) {}

  getAllFieldsByUserIdAndFinancialYear(userId: number, financialYear: string): Observable<any[]> {
    const currentTime = Date.now();
    let params = new HttpParams()
      .set('userId', userId.toString())
      .set('financialYear', financialYear);

    if (this.fieldCache.length > 0 && (currentTime - this.lastCacheTime) < this.cacheTTL) {
      return of(this.fieldCache);
    } else {
      this.clearCacheIfStale(currentTime);
      return this.http.get<any[]>(this.apiUrl, { params }).pipe(
        tap(data => {
          this.fieldCache = data;
          this.lastCacheTime = currentTime;
          this.saveToLocalStorage();
        }),
        catchError(this.handleError<any[]>('getAllFieldsByUserIdAndFinancialYear', []))
      );
    }
  }

  addField(field: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, field).pipe(
      tap(newField => {
        this.fieldCache = [...this.fieldCache, newField];
        this.saveToLocalStorage();
      }),
      catchError(this.handleError<any>('addField'))
    );
  }

  updateField(fieldId: number, field: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${fieldId}`, field).pipe(
      tap(updatedField => {
        const index = this.fieldCache.findIndex(f => f.id === fieldId);
        if (index !== -1) {
          this.fieldCache[index] = updatedField;
          this.saveToLocalStorage();
        }
      }),
      catchError(this.handleError<any>('updateField'))
    );
  }

  deleteField(fieldId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${fieldId}`).pipe(
      tap(() => {
        this.fieldCache = this.fieldCache.filter(f => f.id !== fieldId);
        this.saveToLocalStorage();
      }),
      catchError(this.handleError<any>('deleteField'))
    );
  }

  clearCache(): void {
    this.fieldCache = []; // Clear field cache
    this.lastCacheTime = 0;
    this.saveToLocalStorage();
  }

  switchUserAndFinancialYear(userId: number, financialYear: string): Observable<any> {
    this.clearCache();
    return this.getAllFieldsByUserIdAndFinancialYear(userId, financialYear);
  }  

  private clearCacheIfStale(currentTime: number): void {
    if ((currentTime - this.lastCacheTime) >= this.cacheTTL) {
      this.clearCache();
    }
  }

  private loadFromLocalStorage(): any[] {
    const fields = localStorage.getItem(FIELDS_KEY);
    return fields ? JSON.parse(fields) : [];
  }

  private saveToLocalStorage(): void {
    localStorage.setItem(FIELDS_KEY, JSON.stringify(this.fieldCache));
    localStorage.setItem(LAST_CACHE_TIME_KEY, this.lastCacheTime.toString());
  }

  private getLastCacheTime(): number {
    const lastCacheTime = localStorage.getItem(LAST_CACHE_TIME_KEY);
    return lastCacheTime ? parseInt(lastCacheTime, 10) : 0;
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      return of(result as T);
    };
  }
}
