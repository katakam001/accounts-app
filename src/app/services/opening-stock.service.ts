import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

const OPENING_STOCK_KEY = 'cached-opening-stock';
const LAST_CACHE_TIME_KEY = 'last-cache-time-opening-stock';

@Injectable({
  providedIn: 'root'
})
export class OpeningStockService {
  private baseUrl = environment.apiUrl;
  private apiUrl = `${this.baseUrl}/api/opening-stock`;
  private stocks: any[] = this.loadFromLocalStorage();
  private cacheTTL = environment.cacheTTL;
  private lastCacheTime: number = this.getLastCacheTime();

  constructor(private http: HttpClient) {}

  getOpeningStockByUserIdAndFinancialYear(userId: number, financialYear: string): Observable<any[]> {
    const currentTime = Date.now();
    const params = new HttpParams()
      .set('userId', userId.toString())
      .set('financialYear', financialYear);

    if (this.stocks.length > 0 && (currentTime - this.lastCacheTime) < this.cacheTTL) {
      return of(this.stocks);
    } else {
      this.clearCacheIfStale(currentTime);
      return this.http.get<any[]>(this.apiUrl, { params }).pipe(
        tap(data => {
          this.stocks = data;
          this.lastCacheTime = currentTime;
          this.saveToLocalStorage();
        }),
        catchError(this.handleError<any[]>('getByUserAndYear', []))
      );
    }
  }

  add(stock: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, stock).pipe(
      tap(newStock => {
        this.stocks = [...this.stocks, newStock];
        this.saveToLocalStorage();
      }),
      catchError(this.handleError<any>('add'))
    );
  }

  update(id: number, stock: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, stock).pipe(
      tap(updatedStock => {
        const index = this.stocks.findIndex(s => s.id === id);
        if (index !== -1) {
          this.stocks[index] = updatedStock;
          this.saveToLocalStorage();
        }
      }),
      catchError(this.handleError<any>('update'))
    );
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.stocks = this.stocks.filter(s => s.id !== id);
        this.saveToLocalStorage();
      }),
      catchError(this.handleError<any>('delete'))
    );
  }

  switchUserAndFinancialYear(userId: number, financialYear: string): Observable<any[]> {
    this.clearCache();
    return this.getOpeningStockByUserIdAndFinancialYear(userId, financialYear);
  }

  private clearCache(): void {
    this.stocks = [];
    this.lastCacheTime = 0;
    this.saveToLocalStorage();
  }

  private clearCacheIfStale(currentTime: number): void {
    if ((currentTime - this.lastCacheTime) >= this.cacheTTL) {
      this.clearCache();
    }
  }

  private loadFromLocalStorage(): any[] {
    const stocks = localStorage.getItem(OPENING_STOCK_KEY);
    return stocks ? JSON.parse(stocks) : [];
  }

  private saveToLocalStorage(): void {
    localStorage.setItem(OPENING_STOCK_KEY, JSON.stringify(this.stocks));
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
