import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
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
      catchError((error: any) => {
        if (error.error && error.error.message && error.error.message.includes('delete unit')) {
          // Handle duplicate error specifically
          if (error.error.detail.includes('entries'))
            return throwError(() => new Error('Unit deletion failed: This unit is associated with existing invoices. Please remove or reassign the invoices linked to this unit before attempting deletion.'));
          else if (error.error.detail.includes('category_units'))
            return throwError(() => new Error('Unit deletion failed: This unit is associated with existing category units. Please remove or reassign the category units linked to this unit before attempting deletion.'));
          else if (error.error.detail.includes('raw_items'))
            return throwError(() => new Error('Unit deletion failed: This unit is associated with existing Yield setting. Please remove or reassign the yield setting linked to this unit before attempting deletion.'));
          else if (error.error.detail.includes('processed_items'))
            return throwError(() => new Error('Unit deletion failed: This unit is associated with existing Yield setting. Please remove or reassign the yield setting linked to this unit before attempting deletion.'));
          else if (error.error.detail.includes('production_entries'))
            return throwError(() => new Error('Unit deletion failed: This unit is associated with existing production entries. Please remove or reassign the production entries linked to this unit before attempting deletion.'));
          else if (error.error.detail.includes('stock_register'))
            return throwError(() => new Error('Unit deletion failed: This unit is associated with existing production entries or invoices. Please remove or reassign the production entries or invoices linked to this unit before attempting deletion.'));
          else
            return throwError(() => new Error(error.error.detail)); // Re-throw error if needed
        } else {
          // Handle other errors
          return throwError(() => new Error('Failed to delete group. Please try again later.'));
        }
      }));
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
