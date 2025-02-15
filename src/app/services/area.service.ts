import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

const AREAS_KEY = 'cached-areas';
const LAST_CACHE_TIME_KEY = 'last-cache-time-areas';

@Injectable({
  providedIn: 'root'
})
export class AreaService {
  private baseUrl = environment.apiUrl;
  private apiUrl = `${this.baseUrl}/api/areas`; // Append the path to the base URL
  private areas: any[] = this.loadFromLocalStorage();
  private cacheTTL = environment.cacheTTL; // 1 day in milliseconds
  private lastCacheTime: number = this.getLastCacheTime();

  constructor(private http: HttpClient) {}

  getAreasByUserIdAndFinancialYear(userId: number, financialYear: string): Observable<any[]> {
    const currentTime = Date.now();
    let params = new HttpParams()
      .set('userId', userId.toString())
      .set('financialYear', financialYear);

    if (this.areas.length > 0 && (currentTime - this.lastCacheTime) < this.cacheTTL) {
      return of(this.areas);
    } else {
      this.clearCacheIfStale(currentTime);
      return this.http.get<any[]>(this.apiUrl, { params }).pipe(
        tap(data => {
          this.areas = data;
          this.lastCacheTime = currentTime;
          this.saveToLocalStorage();
        }),
        catchError(this.handleError<any[]>('getAreasByUserIdAndFinancialYear', []))
      );
    }
  }

  addArea(area: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, area).pipe(
      tap(newArea => {
        this.areas = [...this.areas, newArea];
        this.saveToLocalStorage();
      }),
      catchError(this.handleError<any>('addArea'))
    );
  }

  updateArea(id: number, area: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, area).pipe(
      tap(updatedArea => {
        const index = this.areas.findIndex(a => a.id === id);
        if (index !== -1) {
          this.areas[index] = updatedArea;
          this.saveToLocalStorage();
        }
      }),
      catchError(this.handleError<any>('updateArea'))
    );
  }

  deleteArea(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.areas = this.areas.filter(a => a.id !== id);
        this.saveToLocalStorage();
      }),
      catchError(this.handleError<any>('deleteArea'))
    );
  }

  clearCache(): void {
    this.areas = [];
    this.lastCacheTime = 0;
    this.saveToLocalStorage();
  }

  switchUserAndFinancialYear(userId: number, financialYear: string): Observable<any> {
    this.clearCache();
    return this.getAreasByUserIdAndFinancialYear(userId, financialYear);
  }

  private clearCacheIfStale(currentTime: number): void {
    if ((currentTime - this.lastCacheTime) >= this.cacheTTL) {
      this.clearCache();
    }
  }

  private loadFromLocalStorage(): any[] {
    const areas = localStorage.getItem(AREAS_KEY);
    return areas ? JSON.parse(areas) : [];
  }

  private saveToLocalStorage(): void {
    localStorage.setItem(AREAS_KEY, JSON.stringify(this.areas));
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
