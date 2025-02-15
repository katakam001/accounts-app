import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

const CONVERSIONS_KEY = 'cached-conversions';
const LAST_CACHE_TIME_KEY = 'last-cache-time-conversions';

@Injectable({
  providedIn: 'root'
})
export class ConversionService {
  private baseUrl = environment.apiUrl;
  private apiUrl = `${this.baseUrl}/api/conversions`; // Append the path to the base URL
  private conversions: any[] = this.loadFromLocalStorage();
  private cacheTTL = environment.cacheTTL; // 1 day in milliseconds
  private lastCacheTime: number = this.getLastCacheTime();

  constructor(private http: HttpClient) {}

  getConversionsByUserIdAndFinancialYear(userId: number, financialYear: string): Observable<any[]> {
    const currentTime = Date.now();
    let params = new HttpParams()
      .set('userId', userId.toString())
      .set('financialYear', financialYear);

    if (this.conversions.length > 0 && (currentTime - this.lastCacheTime) < this.cacheTTL) {
      return of(this.conversions);
    } else {
      this.clearCacheIfStale(currentTime);
      return this.http.get<any[]>(this.apiUrl, { params }).pipe(
        tap(data => {
          this.conversions = data;
          this.lastCacheTime = currentTime;
          this.saveToLocalStorage();
        }),
        catchError(this.handleError<any[]>('getConversionsByUserIdAndFinancialYear', []))
      );
    }
  }

  addConversion(conversion: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, conversion).pipe(
      tap(newConversion => {
        this.conversions = [...this.conversions, newConversion];
        this.saveToLocalStorage();
      }),
      catchError(this.handleError<any>('addConversion'))
    );
  }

  updateConversion(id: number, conversion: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, conversion).pipe(
      tap(updatedConversion => {
        const index = this.conversions.findIndex(c => c.id === id);
        if (index !== -1) {
          this.conversions[index] = updatedConversion;
          this.saveToLocalStorage();
        }
      }),
      catchError(this.handleError<any>('updateConversion'))
    );
  }

  deleteConversion(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.conversions = this.conversions.filter(c => c.id !== id);
        this.saveToLocalStorage();
      }),
      catchError(this.handleError<any>('deleteConversion'))
    );
  }

  clearCache(): void {
    this.conversions = [];
    this.lastCacheTime = 0;
    this.saveToLocalStorage();
  }

  switchUserAndFinancialYear(userId: number, financialYear: string): Observable<any> {
    this.clearCache();
    return this.getConversionsByUserIdAndFinancialYear(userId, financialYear);
  }

  private clearCacheIfStale(currentTime: number): void {
    if ((currentTime - this.lastCacheTime) >= this.cacheTTL) {
      this.clearCache();
    }
  }

  private loadFromLocalStorage(): any[] {
    const conversions = localStorage.getItem(CONVERSIONS_KEY);
    return conversions ? JSON.parse(conversions) : [];
  }

  private saveToLocalStorage(): void {
    localStorage.setItem(CONVERSIONS_KEY, JSON.stringify(this.conversions));
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
