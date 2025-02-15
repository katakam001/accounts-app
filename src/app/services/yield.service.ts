import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Yield } from '../models/yield.interface';

const YIELDS_KEY = 'cached-yields';
const LAST_CACHE_TIME_KEY = 'last-cache-time-yields';

@Injectable({
  providedIn: 'root'
})
export class YieldService {
  private baseUrl = environment.apiUrl;
  private apiUrl = `${this.baseUrl}/api/yields`; // Append the path to the base URL
  private yields: Yield[] = this.loadFromLocalStorage();
  private cacheTTL = environment.cacheTTL; // 1 day in milliseconds
  private lastCacheTime: number = this.getLastCacheTime();

  constructor(private http: HttpClient) {}

  getYieldsByUserIdAndFinancialYear(userId: number, financialYear: string): Observable<Yield[]> {
    const currentTime = Date.now();
    let params = new HttpParams()
      .set('userId', userId.toString())
      .set('financialYear', financialYear);

    if (this.yields.length > 0 && (currentTime - this.lastCacheTime) < this.cacheTTL) {
      return of(this.yields);
    } else {
      this.clearCacheIfStale(currentTime);
      return this.http.get<Yield[]>(this.apiUrl, { params }).pipe(
        tap(data => {
          this.yields = data;
          this.lastCacheTime = currentTime;
          this.saveToLocalStorage();
        }),
        catchError(this.handleError<Yield[]>('getYieldsByUserIdAndFinancialYear', []))
      );
    }
  }

  createYield(yieldData: any): Observable<Yield> {
    return this.http.post<Yield>(this.apiUrl, yieldData).pipe(
      tap((response: any) => {
        const newYield = {
          ...yieldData,
          rawItem: { ...yieldData.rawItem, id: response.newRawItemId },
          processedItems: yieldData.processedItems.map((item :any)=> ({
            ...item,
            raw_item_id: response.newRawItemId
          }))
        };
        this.yields = [...this.yields, newYield];
        this.saveToLocalStorage();
      }),
      catchError(this.handleError<Yield>('createYield'))
    );
  }

  updateYield(id: number, yieldData: any): Observable<Yield> {
    return this.http.put<Yield>(`${this.apiUrl}/${id}`, yieldData).pipe(
      tap((response: any) => {
        const index = this.yields.findIndex((y:any) => y.rawItem.id === id);
        if (index !== -1) {
          this.yields[index] = yieldData;
          this.saveToLocalStorage();
        }
      }),
      catchError(this.handleError<Yield>('updateYield'))
    );
  }

  deleteYield(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.yields = this.yields.filter((y:any) => y.rawItem.id !== id);
        this.saveToLocalStorage();
      }),
      catchError(this.handleError<any>('deleteYield'))
    );
  }

  switchUserAndFinancialYear(userId: number, financialYear: string): Observable<any> {
    this.clearCache();
    return this.getYieldsByUserIdAndFinancialYear(userId, financialYear);
  }

  clearCache(): void {
    this.yields = [];
    this.lastCacheTime = 0;
    this.saveToLocalStorage();
  }

  private clearCacheIfStale(currentTime: number): void {
    if ((currentTime - this.lastCacheTime) >= this.cacheTTL) {
      this.clearCache();
    }
  }

  private loadFromLocalStorage(): Yield[] {
    const yields = localStorage.getItem(YIELDS_KEY);
    return yields ? JSON.parse(yields) : [];
  }

  private saveToLocalStorage(): void {
    localStorage.setItem(YIELDS_KEY, JSON.stringify(this.yields));
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
