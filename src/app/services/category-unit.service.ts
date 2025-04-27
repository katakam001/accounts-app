import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

const CATEGORY_UNITS_KEY = 'cached-category-units';
const LAST_CACHE_TIME_KEY = 'last-cache-time-category-units';

@Injectable({
  providedIn: 'root'
})
export class CategoryUnitService {
  private baseUrl = environment.apiUrl;
  private apiUrl = `${this.baseUrl}/api/category-units`; // Append the path to the base URL
  private cacheTTL = environment.cacheTTL; // 1 day in milliseconds
  private lastCacheTime: number = this.getLastCacheTime();
  private categoryCache: { [key: string]: { data: any[], timestamp: number } } = this.loadFromLocalStorage(); // Cache for category units

  constructor(private http: HttpClient) {}

  getCategoryUnitsByUserIdAndFinancialYear(userId: number, financialYear: string): Observable<any[]> {
    const currentTime = Date.now();
    const cacheKey = `all_${userId}_${financialYear}`;
    let params = new HttpParams()
      .set('userId', userId.toString())
      .set('financialYear', financialYear);
  
    if (this.categoryCache[cacheKey] && (currentTime - this.categoryCache[cacheKey].timestamp) < this.cacheTTL) {
      return of(this.categoryCache[cacheKey].data);
    } else {
      this.clearCacheIfStale(currentTime);
      return this.http.get<any[]>(this.apiUrl, { params }).pipe(
        tap(data => {
          this.categoryCache[cacheKey] = { data, timestamp: currentTime };
          data.forEach(categoryUnit => {
            const individualCacheKey = `category_${userId}_${financialYear}_${categoryUnit.category_id}`;
            if (!this.categoryCache[individualCacheKey]) {
              this.categoryCache[individualCacheKey] = { data: [], timestamp: currentTime };
            }
            this.categoryCache[individualCacheKey].data = [...this.categoryCache[individualCacheKey].data, categoryUnit];
          });
          this.lastCacheTime = currentTime;
          this.saveToLocalStorage();
        }),
        catchError(this.handleError<any[]>('getCategoryUnitsByUserIdAndFinancialYear', []))
      );
    }
  }  

  getUnitsByCategory(userId: number, financialYear: string, categoryId: number): Observable<any[]> {
    const currentTime = Date.now();
    const cacheKey = `category_${userId}_${financialYear}_${categoryId}`;
    let params = new HttpParams()
      .set('userId', userId.toString())
      .set('financialYear', financialYear)
      .set('categoryId', categoryId.toString());

    if (this.categoryCache[cacheKey] && (currentTime - this.categoryCache[cacheKey].timestamp) < this.cacheTTL) {
      return of(this.categoryCache[cacheKey].data);
    } else {
      return this.http.get<any[]>(this.apiUrl, { params }).pipe(
        tap(data => {
          this.categoryCache[cacheKey] = { data, timestamp: currentTime };
          this.saveToLocalStorage();
        }),
        catchError(this.handleError<any[]>('getUnitsByCategory', []))
      );
    }
  }

  addCategoryUnit(categoryUnit: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, categoryUnit).pipe(
      tap(newCategoryUnit => {
        const allCacheKey = `all_${categoryUnit.user_id}_${categoryUnit.financial_year}`;
        if (this.categoryCache[allCacheKey]) {
          this.categoryCache[allCacheKey].data = [...this.categoryCache[allCacheKey].data, newCategoryUnit];
        }
        const categoryCacheKey = `category_${categoryUnit.user_id}_${categoryUnit.financial_year}_${newCategoryUnit.category_id}`;
        if (this.categoryCache[categoryCacheKey]) {
          this.categoryCache[categoryCacheKey].data = [...this.categoryCache[categoryCacheKey].data, newCategoryUnit];
        }
        this.saveToLocalStorage();
      }),
      catchError(this.handleError<any>('addCategoryUnit'))
    );
  }

  updateCategoryUnit(categoryUnitId: number, categoryUnit: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${categoryUnitId}`, categoryUnit).pipe(
      tap(updatedCategoryUnit => {
        const allCacheKey = `all_${categoryUnit.user_id}_${categoryUnit.financial_year}`;
        if (this.categoryCache[allCacheKey]) {
          const index = this.categoryCache[allCacheKey].data.findIndex(cu => cu.id === categoryUnitId);
          if (index !== -1) {
            this.categoryCache[allCacheKey].data[index] = updatedCategoryUnit;
          }
        }
        const categoryCacheKey = `category_${categoryUnit.user_id}_${categoryUnit.financial_year}_${updatedCategoryUnit.categoryId}`;
        if (this.categoryCache[categoryCacheKey]) {
          const index = this.categoryCache[categoryCacheKey].data.findIndex(cu => cu.id === categoryUnitId);
          if (index !== -1) {
            this.categoryCache[categoryCacheKey].data[index] = updatedCategoryUnit;
          }
        }
        this.saveToLocalStorage();
      }),
      catchError(this.handleError<any>('updateCategoryUnit'))
    );
  }

  deleteCategoryUnit(categoryUnitId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${categoryUnitId}`).pipe(
      tap(() => {
        Object.keys(this.categoryCache).forEach(cacheKey => {
          this.categoryCache[cacheKey].data = this.categoryCache[cacheKey].data.filter(cu => cu.id !== categoryUnitId);
        });
        this.saveToLocalStorage();
      }),
      catchError((error: any) => {
        if (error.error && error.error.message && error.error.message.includes('delete category_units')) {
          // Handle duplicate error specifically
          if (error.error.detail.includes('invoices'))
            return throwError(() => new Error('Category units deletion failed: This Category unit is associated with existing invoice. Please remove or reassign the invoice linked to this Category unit before attempting deletion.'));
          else
            return throwError(() => new Error(error.error.detail)); // Re-throw error if needed    
        } else {
          // Handle other errors
          return throwError(() => new Error('Failed to delete category units. Please try again later.'));
        }
      }));
  }

  clearCache(): void {
    this.categoryCache = {}; // Clear category cache
    this.lastCacheTime = 0;
    this.saveToLocalStorage();
  }

  switchUserAndFinancialYear(userId: number, financialYear: string): Observable<any> {
    this.clearCache();
    return this.getCategoryUnitsByUserIdAndFinancialYear(userId, financialYear);
  }  

  private clearCacheIfStale(currentTime: number): void {
    if ((currentTime - this.lastCacheTime) >= this.cacheTTL) {
      this.clearCache();
    }
  }

  private loadFromLocalStorage(): { [key: string]: { data: any[], timestamp: number } } {
    const categoryCache = localStorage.getItem(CATEGORY_UNITS_KEY);
    return categoryCache ? JSON.parse(categoryCache) : {};
  }

  private saveToLocalStorage(): void {
    localStorage.setItem(CATEGORY_UNITS_KEY, JSON.stringify(this.categoryCache));
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
