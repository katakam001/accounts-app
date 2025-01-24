import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Item } from '../models/Item.interface';



const ITEMS_KEY = 'cached-items';
const LAST_CACHE_TIME_KEY = 'last-cache-time-items';

@Injectable({
  providedIn: 'root'
})
export class ItemsService {
  private baseUrl = environment.apiUrl;
  private apiUrl = `${this.baseUrl}/api/items`; // Append the path to the base URL
  private items: Item[] = this.loadFromLocalStorage();
  private cacheTTL = environment.cacheTTL; // 1 day in milliseconds
  private lastCacheTime: number = this.getLastCacheTime();

  constructor(private http: HttpClient) {}

  getItemsByUserIdAndFinancialYear(userId: number, financialYear: string): Observable<Item[]> {
    const currentTime = Date.now();
    let params = new HttpParams()
      .set('userId', userId.toString())
      .set('financialYear', financialYear);

    if (this.items.length > 0 && (currentTime - this.lastCacheTime) < this.cacheTTL) {
      return of(this.items);
    } else {
      this.clearCacheIfStale(currentTime);
      return this.http.get<Item[]>(this.apiUrl, { params }).pipe(
        tap(data => {
          this.items = data;
          this.lastCacheTime = currentTime;
          this.saveToLocalStorage();
        }),
        catchError(this.handleError<Item[]>('getItemsByUserIdAndFinancialYear', []))
      );
    }
  }

  addItem(item: any): Observable<Item> {
    return this.http.post<Item>(this.apiUrl, item).pipe(
      tap(newItem => {
        this.items.push(newItem);
        this.saveToLocalStorage();
      }),
      catchError(this.handleError<Item>('addItem'))
    );
  }

  editItem(id: number, item: any): Observable<Item> {
    return this.http.put<Item>(`${this.apiUrl}/${id}`, item).pipe(
      tap(updatedItem => {
        const index = this.items.findIndex(i => i.id === id);
        if (index !== -1) {
          this.items[index] = updatedItem;
          this.saveToLocalStorage();
        }
      }),
      catchError(this.handleError<Item>('editItem'))
    );
  }

  deleteItem(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.items = this.items.filter(i => i.id !== id);
        this.saveToLocalStorage();
      }),
      catchError(this.handleError<any>('deleteItem'))
    );
  }

  clearCache(): void {
    this.items = [];
    this.lastCacheTime = 0;
    this.saveToLocalStorage();
  }

  switchUserAndFinancialYear(userId: number, financialYear: string): Observable<any> {
    this.clearCache();
    return this.getItemsByUserIdAndFinancialYear(userId, financialYear);
  }

  private clearCacheIfStale(currentTime: number): void {
    if ((currentTime - this.lastCacheTime) >= this.cacheTTL) {
      this.clearCache();
    }
  }

  private loadFromLocalStorage(): Item[] {
    const items = localStorage.getItem(ITEMS_KEY);
    return items ? JSON.parse(items) : [];
  }

  private saveToLocalStorage(): void {
    localStorage.setItem(ITEMS_KEY, JSON.stringify(this.items));
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
