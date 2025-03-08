import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

const GROUP_MAPPING_KEY = 'cached-group-mappings';
const LAST_CACHE_TIME_KEY = 'last-cache-time-group-mappings';

@Injectable({
  providedIn: 'root'
})
export class GroupMappingService {
  private baseUrl = environment.apiUrl;
  private apiUrl = `${this.baseUrl}/api`; // Append the path to the base URL
  private cacheTTL = environment.cacheTTL; // Cache Time-To-Live, e.g., 1 day in milliseconds
  private lastCacheTime: number = this.getLastCacheTime();
  private groupMappingCache: any[] = this.loadFromLocalStorage(); // Cache for group mappings

  constructor(private http: HttpClient) {}

  getGroupMappingTree(userId: number, financialYear: string): Observable<any[]> {
    const currentTime = Date.now();
    let params = new HttpParams()
      .set('userId', userId.toString())
      .set('financialYear', financialYear);

    if (this.groupMappingCache.length > 0 && (currentTime - this.lastCacheTime) < this.cacheTTL) {
      return of(this.groupMappingCache);
    } else {
      this.clearCacheIfStale(currentTime);
      return this.http.get<any[]>(`${this.apiUrl}/groupMappingTree`, { params }).pipe(
        tap(data => {
          this.groupMappingCache = data;
          this.lastCacheTime = currentTime;
          this.saveToLocalStorage();
        }),
        catchError(this.handleError<any[]>('getGroupMappingTree', []))
      );
    }
  }

  addGroupMapping(group: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/addGroupMapping`, group).pipe(
      tap(() => this.clearCache()), // Clear the cache after adding a group
      catchError(this.handleError<any>('addGroupMapping')) // Handle errors
    );
  }
  
  updateGroupMapping(group: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/updateGroupMapping/${group.id}`, group).pipe(
      tap(() => this.clearCache()), // Clear the cache after updating a group
      catchError(this.handleError<any>('updateGroupMapping')) // Handle errors
    );
  }

  deleteGroupMapping(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/deleteGroupMapping/${id}`).pipe(
      tap(() => this.clearCache()), // Clear the cache after deleting a group
      catchError(this.handleError<any>('deleteGroupMapping')) // Handle errors
    );
  }

  clearCache(): void {
    this.groupMappingCache = []; // Clear group mapping cache
    this.lastCacheTime = 0;
    this.saveToLocalStorage();
  }

  switchUserAndFinancialYear(userId: number, financialYear: string): Observable<any> {
    this.clearCache();
    return this.getGroupMappingTree(userId, financialYear);
  }

  private clearCacheIfStale(currentTime: number): void {
    if ((currentTime - this.lastCacheTime) >= this.cacheTTL) {
      this.clearCache();
    }
  }

  private loadFromLocalStorage(): any[] {
    const groupMappings = localStorage.getItem(GROUP_MAPPING_KEY);
    return groupMappings ? JSON.parse(groupMappings) : [];
  }

  private saveToLocalStorage(): void {
    localStorage.setItem(GROUP_MAPPING_KEY, JSON.stringify(this.groupMappingCache));
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
