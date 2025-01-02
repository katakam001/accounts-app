import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

const CATEGORIES_KEY = 'cached-categories';
const LAST_CACHE_TIME_KEY = 'last-cache-time-categories';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private baseUrl = environment.apiUrl;
  private apiUrl = `${this.baseUrl}/api/categories`; // Append the path to the base URL
  private cacheTTL = environment.cacheTTL; // 1 day in milliseconds
  private lastCacheTime: number = this.getLastCacheTime();
  private categoryCache: { [key: string]: { data: any[], timestamp: number } } = this.loadFromLocalStorage(); // Cache for categories

  constructor(private http: HttpClient) {}

  getCategoriesByUserIdAndFinancialYear(userId: number, financialYear: string): Observable<any[]> {
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
          data.forEach(category => {
            const individualCacheKey = `type_${userId}_${financialYear}_${category.type}`;
            if (!this.categoryCache[individualCacheKey]) {
              this.categoryCache[individualCacheKey] = { data: [], timestamp: currentTime };
            }
            this.categoryCache[individualCacheKey].data.push(category);
          });
          this.lastCacheTime = currentTime;
          this.saveToLocalStorage();
        }),
        catchError(this.handleError<any[]>('getCategoriesByUserIdAndFinancialYear', []))
      );
    }
  }
  

  getCategoriesByType(userId: number, financialYear: string, type: number): Observable<any[]> {
    const currentTime = Date.now();
    const cacheKey = `type_${userId}_${financialYear}_${type}`;
    let params = new HttpParams()
      .set('userId', userId.toString())
      .set('financialYear', financialYear)
      .set('type', type.toString());

    if (this.categoryCache[cacheKey] && (currentTime - this.categoryCache[cacheKey].timestamp) < this.cacheTTL) {
      return of(this.categoryCache[cacheKey].data);
    } else {
      return this.http.get<any[]>(this.apiUrl, { params }).pipe(
        tap(data => {
          this.categoryCache[cacheKey] = { data, timestamp: currentTime };
          this.saveToLocalStorage();
        }),
        catchError(this.handleError<any[]>('getCategoriesByType', []))
      );
    }
  }

  addCategory(category: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, category).pipe(
      tap(newCategory => {
        const allCacheKey = `all_${category.userId}_${category.financialYear}`;
        if (this.categoryCache[allCacheKey]) {
          this.categoryCache[allCacheKey].data.push(newCategory);
        }
        const typeCacheKey = `type_${category.userId}_${category.financialYear}_${newCategory.type}`;
        if (this.categoryCache[typeCacheKey]) {
          this.categoryCache[typeCacheKey].data.push(newCategory);
        }
        this.saveToLocalStorage();
      }),
      catchError(this.handleError<any>('addCategory'))
    );
  }

  updateCategory(categoryId: number, category: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${categoryId}`, category).pipe(
      tap(updatedCategory => {
        const allCacheKey = `all_${category.userId}_${category.financialYear}`;
        if (this.categoryCache[allCacheKey]) {
          const index = this.categoryCache[allCacheKey].data.findIndex(c => c.id === categoryId);
          if (index !== -1) {
            this.categoryCache[allCacheKey].data[index] = updatedCategory;
          }
        }
        const typeCacheKey = `type_${category.userId}_${category.financialYear}_${updatedCategory.type}`;
        if (this.categoryCache[typeCacheKey]) {
          const index = this.categoryCache[typeCacheKey].data.findIndex(c => c.id === categoryId);
          if (index !== -1) {
            this.categoryCache[typeCacheKey].data[index] = updatedCategory;
          }
        }
        this.saveToLocalStorage();
      }),
      catchError(this.handleError<any>('updateCategory'))
    );
  }

  deleteCategory(categoryId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${categoryId}`).pipe(
      tap(() => {
        Object.keys(this.categoryCache).forEach(cacheKey => {
          this.categoryCache[cacheKey].data = this.categoryCache[cacheKey].data.filter(c => c.id !== categoryId);
        });
        this.saveToLocalStorage();
      }),
      catchError(this.handleError<any>('deleteCategory'))
    );
  }

  clearCache(): void {
    this.categoryCache = {}; // Clear category cache
    this.lastCacheTime = 0;
    this.saveToLocalStorage();
  }

  switchUserAndFinancialYear(userId: number, financialYear: string): Observable<any> {
    this.clearCache();
    return this.getCategoriesByUserIdAndFinancialYear(userId, financialYear);
  }  

  private clearCacheIfStale(currentTime: number): void {
    if ((currentTime - this.lastCacheTime) >= this.cacheTTL) {
      this.clearCache();
    }
  }

  private loadFromLocalStorage(): { [key: string]: { data: any[], timestamp: number } } {
    const categoryCache = localStorage.getItem(CATEGORIES_KEY);
    return categoryCache ? JSON.parse(categoryCache) : {};
  }

  private saveToLocalStorage(): void {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(this.categoryCache));
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
