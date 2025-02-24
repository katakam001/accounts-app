import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap, map, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { NgxIndexedDBService } from 'ngx-indexed-db';

const FIELD_MAPPINGS_KEY = 'cached-field-mappings';
const LAST_CACHE_TIME_KEY = 'last-cache-time-field-mappings';
const TOTAL_FIELD_MAPPINGS_COUNT_KEY = 'total-field-mappings-count';

@Injectable({
  providedIn: 'root'
})
export class FieldMappingService {
  private baseUrl = environment.apiUrl;
  private apiUrl = `${this.baseUrl}/api/fieldsMapping`; // Append the path to the base URL
  private cacheTTL = environment.cacheTTL; // 1 day in milliseconds
  private cacheCapacity = environment.fieldMappingCacheCapacity; // Number of records to keep in memory
  constructor(private http: HttpClient, private dbService: NgxIndexedDBService) {}

  getFieldMappingsByUserIdAndFinancialYear(userId: number, financialYear: string): Observable<any[]> {
    const currentTime = Date.now();
    this.clearCacheIfStale(currentTime); // Ensure cache is fresh

    // Retrieve cached field mappings from localStorage
    let cachedFieldMappings = this.getCachedFieldMappings();

      return this.dbService.getAll('fieldMappings').pipe(
        map((dbFieldMappings: unknown[]) => {
          let fieldMappings = dbFieldMappings as any[];
          // Combine the cached field mappings with the remaining field mappings from IndexedDB
          const combinedFieldMappings = [...cachedFieldMappings, ...fieldMappings];
          return combinedFieldMappings;
        }),
        switchMap((combinedFieldMappings: any[]) => {
          const totalFieldMappingsCount = this.getTotalFieldMappingsCount();
          if (combinedFieldMappings.length < totalFieldMappingsCount || totalFieldMappingsCount == 0) {
            return this.fetchFieldMappingsFromServer(userId, financialYear, combinedFieldMappings);
          }
          return of(combinedFieldMappings);
        }),
        catchError((error: any) => {
          console.error('Error fetching field mappings from DB:', error);
          return this.fetchFieldMappingsFromServer(userId, financialYear, cachedFieldMappings);
        })
      );
  }

  getFieldMappingsByCategory(userId: number, financialYear: string, categoryId: number): Observable<any[]> {
    const currentTime = Date.now();
    this.clearCacheIfStale(currentTime); // Ensure cache is fresh

    // Retrieve cached field mappings from localStorage
    let cachedFieldMappings = this.getCachedFieldMappings().filter(fm => fm.category_id === categoryId);
    console.log(cachedFieldMappings);

      return this.dbService.getAllByIndex('fieldMappings', 'category_id', IDBKeyRange.only(categoryId)).pipe(
        map((dbFieldMappings: unknown[]) => {
          console.log('FieldMappings from DB:', dbFieldMappings); // Debug log
          let fieldMappings = dbFieldMappings as any[];
          // Combine the cached field mappings with the remaining field mappings from IndexedDB
          const combinedFieldMappings = [...cachedFieldMappings, ...fieldMappings];
          console.log('Combined FieldMappings:', combinedFieldMappings); // Debug log
          return combinedFieldMappings;
        }),
        switchMap((combinedFieldMappings: any[]) => {
          console.log('Combined FieldMappings after SwitchMap:', combinedFieldMappings); // Debug log
          const totalFieldMappingsCountForCategory = combinedFieldMappings.filter(fm => fm.category_id === categoryId).length;
          if (combinedFieldMappings.length < totalFieldMappingsCountForCategory || totalFieldMappingsCountForCategory == 0) {
            return this.fetchFieldMappingsFromServerByCategory(userId, financialYear, categoryId, combinedFieldMappings);
          }
          return of(combinedFieldMappings);
        }),
        catchError((error: any) => {
          console.error('Error fetching field mappings from DB:', error);
          return this.fetchFieldMappingsFromServerByCategory(userId, financialYear, categoryId, cachedFieldMappings);
        })
      );
  }

  private fetchFieldMappingsFromServer(userId: number, financialYear: string, cachedFieldMappings: any[]): Observable<any[]> {
    let params = new HttpParams()
      .set('userId', userId.toString())
      .set('financialYear', financialYear);

    return this.http.get<any[]>(this.apiUrl, { params }).pipe(
      tap((apiData: any[]) => {
        const newFieldMappings = this.addToCache(apiData, Date.now());
        newFieldMappings.forEach((fieldMapping: any) => {
          this.dbService.getByKey('fieldMappings', fieldMapping.id).subscribe(existingFieldMapping => {
            if (existingFieldMapping) {
              this.dbService.update('fieldMappings', fieldMapping).subscribe({
                next: () => console.log('Field mapping updated in IndexedDB:', fieldMapping),
                error: (error: any) => console.error('Error updating field mapping in IndexedDB:', error)
              });
            } else {
              this.dbService.add('fieldMappings', fieldMapping).subscribe({
                next: () => console.log('Field mapping added to IndexedDB:', fieldMapping),
                error: (error: any) => console.error('Error adding field mapping to IndexedDB:', error)
              });
            }
          });
        });
      }),
      map((apiData: any[]) => {
        const remainingFieldMappings = apiData.filter(fieldMapping => !cachedFieldMappings.some(cachedFieldMapping => cachedFieldMapping.id === fieldMapping.id));
        return [...cachedFieldMappings, ...remainingFieldMappings];
      }),
      catchError((error: any) => {
        console.error('Error fetching field mappings from API:', error);
        return of([]);
      })
    );
  }

  private fetchFieldMappingsFromServerByCategory(userId: number, financialYear: string, categoryId: number, cachedFieldMappings: any[]): Observable<any[]> {
    let params = new HttpParams()
      .set('userId', userId.toString())
      .set('financialYear', financialYear)
      .set('categoryId', categoryId.toString());

    return this.http.get<any[]>(this.apiUrl, { params }).pipe(
      tap((apiData: any[]) => {
        apiData.forEach((fieldMapping: any) => {
          this.dbService.getByKey('fieldMappings', fieldMapping.id).subscribe(existingFieldMapping => {
            if (existingFieldMapping) {
              this.dbService.update('fieldMappings', fieldMapping).subscribe({
                next: () => console.log('Field mapping updated in IndexedDB:', fieldMapping),
                error: (error: any) => console.error('Error updating field mapping in IndexedDB:', error)
              });
            } else {
              this.dbService.add('fieldMappings', fieldMapping).subscribe({
                next: () => console.log('Field mapping added to IndexedDB:', fieldMapping),
                error: (error: any) => console.error('Error adding field mapping to IndexedDB:', error)
              });
            }
          });
        });
      }),
      map((apiData: any[]) => {
        const remainingFieldMappings = apiData.filter(fieldMapping => !cachedFieldMappings.some(cachedFieldMapping => cachedFieldMapping.id === fieldMapping.id));
        return [...cachedFieldMappings, ...remainingFieldMappings];
      }),
      catchError((error: any) => {
        console.error('Error fetching field mappings from API:', error);
        return of([]);
      })
    );
  }

  private addToCache(data: any[], currentTime: number): any[] {
    // Retrieve cached field mappings from localStorage
    const cachedFieldMappings = this.getCachedFieldMappings();
    const fieldMappingIds = new Set(cachedFieldMappings.map(fieldMapping => fieldMapping.id));
    const newFieldMappings = data.filter(fieldMapping => !fieldMappingIds.has(fieldMapping.id));

    const combinedFieldMappings = [...cachedFieldMappings, ...newFieldMappings];
    if (this.getTotalFieldMappingsCount() == 0) {
      this.setTotalFieldMappingsCount(combinedFieldMappings.length);
    }
    if (combinedFieldMappings.length > this.cacheCapacity) {
      this.setCachedFieldMappings(combinedFieldMappings.slice(-this.cacheCapacity));
    } else {
      this.setCachedFieldMappings(combinedFieldMappings);
    }

    this.setLastCacheTime(currentTime);
    if (newFieldMappings.length == this.getTotalFieldMappingsCount()) {
      const fieldMappingIds = new Set(this.getCachedFieldMappings().map(fieldMapping => fieldMapping.id));
      return newFieldMappings.filter(fieldMapping => !fieldMappingIds.has(fieldMapping.id));
    }
    return newFieldMappings;
  }

  private clearCacheIfStale(currentTime: number): void {
    const lastCacheTime = this.getLastCacheTime();
    if ((currentTime - lastCacheTime) >= this.cacheTTL) {
      this.clearCache();
    }
  }

  clearCache(): void {
    this.setCachedFieldMappings([]);
    this.setLastCacheTime(0);
    this.setTotalFieldMappingsCount(0);

    this.dbService.clear('fieldMappings').subscribe({
      next: () => console.log('IndexedDB fieldMappings store cleared'),
      error: (error: any) => console.error('Error clearing IndexedDB fieldMappings store:', error)
    });
  }

  addFieldMapping(fieldMapping: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, fieldMapping).pipe(
      tap((newFieldMapping: any) => {
        const cachedFieldMappings = this.getCachedFieldMappings();
        let lastFieldMapping: any | undefined = undefined;
  
        // Check if the cache exceeds the capacity
        if (cachedFieldMappings.length + 1 > this.cacheCapacity) {
          lastFieldMapping = cachedFieldMappings.pop(); // Remove the last field mapping
        }
        const updatedFieldMappings = [...cachedFieldMappings, newFieldMapping];
        this.setCachedFieldMappings(updatedFieldMappings);
  
        // Increment totalFieldMappingsCount by 1
        this.setTotalFieldMappingsCount(this.getTotalFieldMappingsCount() + 1);
  
        if (lastFieldMapping) {
          this.dbService.getByKey('fieldMappings', lastFieldMapping.id).subscribe(existingFieldMapping => {
            if (existingFieldMapping) {
              this.dbService.update('fieldMappings', lastFieldMapping).subscribe({
                next: () => console.log('Field mapping updated in IndexedDB:', lastFieldMapping),
                error: (error: any) => console.error('Error updating field mapping in IndexedDB:', error)
              });
            } else {
              this.dbService.add('fieldMappings', lastFieldMapping).subscribe({
                next: () => console.log('Field mapping added to IndexedDB:', lastFieldMapping),
                error: (error: any) => console.error('Error adding field mapping to IndexedDB:', error)
              });
            }
          });
        }
      }),
      catchError(this.handleError<any>('addFieldMapping'))
    );
  }  

  deleteFieldMapping(fieldMappingId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${fieldMappingId}`, { observe: 'response' }).pipe(
      tap(() => {
        const cachedFieldMappings = this.getCachedFieldMappings();
        const updatedFieldMappings = cachedFieldMappings.filter(fm => fm.id !== fieldMappingId);
        this.setCachedFieldMappings(updatedFieldMappings);
        this.setTotalFieldMappingsCount(this.getTotalFieldMappingsCount() - 1);
  
        this.dbService.delete('fieldMappings', fieldMappingId).subscribe({
          next: () => console.log('Field mapping deleted from IndexedDB:', fieldMappingId),
          error: (error: any) => console.error('Error deleting field mapping from IndexedDB:', error)
        });
      }),
      catchError(this.handleError<any>('deleteFieldMapping'))
    );
  }  

  updateFieldMapping(fieldMappingId: number, fieldMapping: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${fieldMappingId}`, fieldMapping).pipe(
      tap(updatedFieldMapping => {
        const cachedFieldMappings = this.getCachedFieldMappings();
        const index = cachedFieldMappings.findIndex(fm => fm.id === fieldMappingId);
        if (index !== -1) {
          cachedFieldMappings[index] = updatedFieldMapping;
          this.setCachedFieldMappings(cachedFieldMappings);
        } else {
          this.dbService.update('fieldMappings', updatedFieldMapping).subscribe({
            next: () => console.log('Field mapping updated in IndexedDB:', updatedFieldMapping),
            error: (error: any) => console.error('Error updating field mapping in IndexedDB:', error)
          });
        }
      }),
      catchError(this.handleError<any>('updateFieldMapping'))
    );
  }  

  switchUserAndFinancialYear(userId: number, financialYear: string): Observable<any> {
    this.clearCache();
    return this.getFieldMappingsByUserIdAndFinancialYear(userId, financialYear);
  }

  private evictCacheIfNeeded(): void {
    const cachedFieldMappings = this.getCachedFieldMappings();
    if (cachedFieldMappings.length > this.cacheCapacity) {
      this.setCachedFieldMappings(cachedFieldMappings.slice(-this.cacheCapacity));
    }
  }

  private getCachedFieldMappings(): any[] {
    const fieldMappings = localStorage.getItem(FIELD_MAPPINGS_KEY);
    return fieldMappings ? JSON.parse(fieldMappings) : [];
  }

  private setCachedFieldMappings(fieldMappings: any[]): void {
    localStorage.setItem(FIELD_MAPPINGS_KEY, JSON.stringify(fieldMappings));
  }

  private getLastCacheTime(): number {
    const lastCacheTime = localStorage.getItem(LAST_CACHE_TIME_KEY);
    return lastCacheTime ? parseInt(lastCacheTime, 10) : 0;
  }

  private setLastCacheTime(time: number): void {
    localStorage.setItem(LAST_CACHE_TIME_KEY, time.toString());
  }

  private getTotalFieldMappingsCount(): number {
    const totalAccountsCount = localStorage.getItem(TOTAL_FIELD_MAPPINGS_COUNT_KEY);
    return totalAccountsCount ? parseInt(totalAccountsCount, 10) : 0;
  }

  private setTotalFieldMappingsCount(count: number): void {
    localStorage.setItem(TOTAL_FIELD_MAPPINGS_COUNT_KEY, count.toString());
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      return of(result as T);
    };
  }

}