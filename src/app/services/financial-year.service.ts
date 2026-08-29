import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';

// Import all dependent services
import { AccountService } from './account.service';
import { FieldMappingService } from './field-mapping.service';
import { AreaService } from './area.service';
import { UnitService } from './unit.service';
import { GroupService } from './group.service';
import { CategoryService } from './category.service';
import { FieldService } from './field.service';
import { BrokerService } from './broker.service';
import { CategoryUnitService } from './category-unit.service';
import { ItemsService } from './items.service';
import { YieldService } from './yield.service';
import { ConversionService } from './conversion.service';
import { GroupMappingService } from './group-mapping.service';
import { OpeningStockService } from './opening-stock.service';

const FINANCIAL_YEAR_KEY = 'financial-year';

@Injectable({
  providedIn: 'root'
})
export class FinancialYearService {
  private currentFinancialYear: string = this.getStoredFinancialYear() || '';
  private baseUrl = environment.apiUrl;
  private apiUrl = `${this.baseUrl}/api/insertFinancialYear`;

  constructor(
    private http: HttpClient,
    private accountService: AccountService,
    private fieldMappingService: FieldMappingService,
    private areaService: AreaService,
    private unitService: UnitService,
    private groupService: GroupService,
    private categoryService: CategoryService,
    private fieldService: FieldService,
    private brokerService: BrokerService,
    private categoryUnitService: CategoryUnitService,
    private itemsService: ItemsService,
    private yieldService: YieldService,
    private conversionService: ConversionService,
    private groupMappingService: GroupMappingService,
    private openingStockService: OpeningStockService
  ) { }

  /**
   * Set financial year and return backend response (status + error_message).
   * Also triggers dependent service updates after backend success.
   */
  setFinancialYear(year: string, userId: number): Observable<any> {
    if (this.currentFinancialYear !== year) {
      this.currentFinancialYear = year;
      this.storeFinancialYear(year);

      return this.setFinancialYearBackend(year).pipe(
        tap(res => {
          console.log('Financial year set successfully on backend:', res);

          // After backend success, update dependent services
          forkJoin([
            this.accountService.switchUserAndFinancialYear(userId, year).pipe(catchError(err => of(null))),
            this.fieldMappingService.switchUserAndFinancialYear(userId, year).pipe(catchError(err => of(null))),
            this.areaService.switchUserAndFinancialYear(userId, year).pipe(catchError(err => of(null))),
            this.unitService.switchUserAndFinancialYear(userId, year).pipe(catchError(err => of(null))),
            this.groupService.switchUserAndFinancialYear(userId, year).pipe(catchError(err => of(null))),
            this.categoryService.switchUserAndFinancialYear(userId, year).pipe(catchError(err => of(null))),
            this.fieldService.switchUserAndFinancialYear(userId, year).pipe(catchError(err => of(null))),
            this.brokerService.switchUserAndFinancialYear(userId, year).pipe(catchError(err => of(null))),
            this.categoryUnitService.switchUserAndFinancialYear(userId, year).pipe(catchError(err => of(null))),
            this.itemsService.switchUserAndFinancialYear(userId, year).pipe(catchError(err => of(null))),
            this.yieldService.switchUserAndFinancialYear(userId, year).pipe(catchError(err => of(null))),
            this.conversionService.switchUserAndFinancialYear(userId, year).pipe(catchError(err => of(null))),
            this.groupMappingService.switchUserAndFinancialYear(userId, year).pipe(catchError(err => of(null))),
            this.openingStockService.switchUserAndFinancialYear(userId, year).pipe(catchError(err => of(null))),
          ]).subscribe({
            next: () => console.log('All dependent services updated.'),
            error: err => console.error('Error updating dependent services:', err)
          });
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error setting financial year on backend:', error);

          // unwrap backend payload if available
          const backendError = error.error || {};
          return of({
            financial_year: year,
            status: backendError.status ?? 4, // default to Failed
            error_message: backendError.error_message ?? error.message,
            message: backendError.message ?? 'Failed to set financial year'
          });
        })
      );
    } else {
      // If year is same, return stored info
      return of({ financial_year: year, status: 3, error_message: null });
    }
  }

  /**
   * Backend call to insert financial year
   */
  setFinancialYearBackend(financialYear: string): Observable<any> {
    return this.http.post<any>(this.apiUrl, { financial_year: financialYear });
  }

  clearFinancialYear(): void {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(FINANCIAL_YEAR_KEY);
      this.currentFinancialYear = '';
    }
  }

  public getStoredFinancialYear(): string | null {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem(FINANCIAL_YEAR_KEY);
    }
    return null;
  }

  private storeFinancialYear(year: string): void {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(FINANCIAL_YEAR_KEY, year);
    }
  }
}
