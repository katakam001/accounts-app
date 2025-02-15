import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

const UNITS_KEY = 'cached-units';
const LAST_CACHE_TIME_KEY = 'last-cache-time-units';

@Injectable({
  providedIn: 'root'
})
export class UnitService {
  private baseUrl = environment.apiUrl;
  private apiUrl = `${this.baseUrl}/api/units`; // Append the path to the base URL
  private cacheTTL = environment.cacheTTL; // 1 day in milliseconds
  private lastCacheTime: number = this.getLastCacheTime();
  private unitCache: any[] = this.loadFromLocalStorage(); // Cache for units

  constructor(private http: HttpClient) {}

  getUnitsByUserIdAndFinancialYear(userId: number, financialYear: string): Observable<any[]> {
    const currentTime = Date.now();
    let params = new HttpParams()
      .set('userId', userId.toString())
      .set('financialYear', financialYear);

    if (this.unitCache.length > 0 && (currentTime - this.lastCacheTime) < this.cacheTTL) {
      return of(this.unitCache);
    } else {
      this.clearCacheIfStale(currentTime);
      return this.http.get<any[]>(this.apiUrl, { params }).pipe(
        tap(data => {
          this.unitCache = data;
          this.lastCacheTime = currentTime;
          this.saveToLocalStorage();
        }),
        catchError(this.handleError<any[]>('getUnitsByUserIdAndFinancialYear', []))
      );
    }
  }

  addUnit(unit: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, unit).pipe(
      tap(newUnit => {
        this.unitCache = [...this.unitCache, newUnit];
        this.saveToLocalStorage();
      }),
      catchError(this.handleError<any>('addUnit'))
    );
  }

  updateUnit(unitId: number, unit: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${unitId}`, unit).pipe(
      tap(updatedUnit => {
        const index = this.unitCache.findIndex(u => u.id === unitId);
        if (index !== -1) {
          this.unitCache[index] = updatedUnit;
          this.saveToLocalStorage();
        }
      }),
      catchError(this.handleError<any>('updateUnit'))
    );
  }

  deleteUnit(unitId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${unitId}`).pipe(
      tap(() => {
        this.unitCache = this.unitCache.filter(u => u.id !== unitId);
        this.saveToLocalStorage();
      }),
      catchError(this.handleError<any>('deleteUnit'))
    );
  }

  clearCache(): void {
    this.unitCache = []; // Clear unit cache
    this.lastCacheTime = 0;
    this.saveToLocalStorage();
  }

  switchUserAndFinancialYear(userId: number, financialYear: string): Observable<any> {
    this.clearCache();
    return this.getUnitsByUserIdAndFinancialYear(userId, financialYear);
  } 

  private clearCacheIfStale(currentTime: number): void {
    if ((currentTime - this.lastCacheTime) >= this.cacheTTL) {
      this.clearCache();
    }
  }

  private loadFromLocalStorage(): any[] {
    const units = localStorage.getItem(UNITS_KEY);
    return units ? JSON.parse(units) : [];
  }

  private saveToLocalStorage(): void {
    localStorage.setItem(UNITS_KEY, JSON.stringify(this.unitCache));
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
