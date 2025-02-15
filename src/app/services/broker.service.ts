import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

const BROKERS_KEY = 'cached-brokers';
const LAST_CACHE_TIME_KEY = 'last-cache-time-brokers';

@Injectable({
  providedIn: 'root'
})
export class BrokerService {
  private baseUrl = environment.apiUrl;
  private apiUrl = `${this.baseUrl}/api/brokers`; // Append the path to the base URL
  private brokers: any[] = this.loadFromLocalStorage();
  private cacheTTL = environment.cacheTTL; // 1 day in milliseconds
  private lastCacheTime: number = this.getLastCacheTime();

  constructor(private http: HttpClient) {}

  getBrokersByUserIdAndFinancialYear(userId: number, financialYear: string): Observable<any[]> {
    const currentTime = Date.now();
    let params = new HttpParams()
      .set('userId', userId.toString())
      .set('financialYear', financialYear);

    if (this.brokers.length > 0 && (currentTime - this.lastCacheTime) < this.cacheTTL) {
      return of(this.brokers);
    } else {
      this.clearCacheIfStale(currentTime);
      return this.http.get<any[]>(this.apiUrl, { params }).pipe(
        tap(data => {
          this.brokers = data;
          this.lastCacheTime = currentTime;
          this.saveToLocalStorage();
        }),
        catchError(this.handleError<any[]>('getBrokersByUserIdAndFinancialYear', []))
      );
    }
  }

  addBroker(broker: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, broker).pipe(
      tap(newBroker => {
        console.log("Broker added (service):", newBroker); // Log in the service
        this.brokers = [...this.brokers, newBroker];
        this.saveToLocalStorage();
      }),
      catchError(this.handleError<any>('addBroker'))
    );
  }

  updateBroker(id: number, broker: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, broker).pipe(
      tap(updatedBroker => {
        const index = this.brokers.findIndex(b => b.id === id);
        if (index !== -1) {
          this.brokers[index] = updatedBroker;
          this.saveToLocalStorage();
        }
      }),
      catchError(this.handleError<any>('updateBroker'))
    );
  }

  deleteBroker(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.brokers = this.brokers.filter(b => b.id !== id);
        this.saveToLocalStorage();
      }),
      catchError(this.handleError<any>('deleteBroker'))
    );
  }

  clearCache(): void {
    this.brokers = [];
    this.lastCacheTime = 0;
    this.saveToLocalStorage();
  }

  switchUserAndFinancialYear(userId: number, financialYear: string): Observable<any> {
    this.clearCache();
    return this.getBrokersByUserIdAndFinancialYear(userId, financialYear);
  }

  private clearCacheIfStale(currentTime: number): void {
    if ((currentTime - this.lastCacheTime) >= this.cacheTTL) {
      this.clearCache();
    }
  }

  private loadFromLocalStorage(): any[] {
    const brokers = localStorage.getItem(BROKERS_KEY);
    return brokers ? JSON.parse(brokers) : [];
  }

  private saveToLocalStorage(): void {
    localStorage.setItem(BROKERS_KEY, JSON.stringify(this.brokers));
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
