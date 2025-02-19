import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
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
import { environment } from '../../environments/environment';

const FINANCIAL_YEAR_KEY = 'financial-year';

@Injectable({
  providedIn: 'root'
})
export class FinancialYearService {
  private currentFinancialYear: string = this.getStoredFinancialYear() || '';
  private baseUrl = environment.apiUrl;
  private apiUrl = `${this.baseUrl}/api/insertFinancialYear`; // Append the path to the base URL
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
  ) { }

  setFinancialYear(year: string, userId: number) {
    if (this.currentFinancialYear !== year) {
      this.currentFinancialYear = year;
      this.storeFinancialYear(year);

      // Call backend API to set financial year
      this.setFinancialYearBackend(year).subscribe({
        next: () => {
          console.log('Financial year set successfully on the backend.');
          // Use forkJoin to call the methods concurrently
          forkJoin([
            this.accountService.switchUserAndFinancialYear(userId, year).pipe(catchError(error => of(null))),
            this.fieldMappingService.switchUserAndFinancialYear(userId, year).pipe(catchError(error => of(null))),
            this.areaService.switchUserAndFinancialYear(userId, year).pipe(catchError(error => of(null))),
            this.unitService.switchUserAndFinancialYear(userId, year).pipe(catchError(error => of(null))),
            this.groupService.switchUserAndFinancialYear(userId, year).pipe(catchError(error => of(null))),
            this.categoryService.switchUserAndFinancialYear(userId, year).pipe(catchError(error => of(null))),
            this.fieldService.switchUserAndFinancialYear(userId, year).pipe(catchError(error => of(null))),
            this.brokerService.switchUserAndFinancialYear(userId, year).pipe(catchError(error => of(null))),
            this.categoryUnitService.switchUserAndFinancialYear(userId, year).pipe(catchError(error => of(null))),
            this.itemsService.switchUserAndFinancialYear(userId, year).pipe(catchError(error => of(null))),
            this.yieldService.switchUserAndFinancialYear(userId, year).pipe(catchError(error => of(null))),
            this.conversionService.switchUserAndFinancialYear(userId, year).pipe(catchError(error => of(null))),
          ]).subscribe({
            next: () => {
              console.log('All services have been updated.');
            },
            error: (error) => {
              console.error('Error updating services:', error);
            }
          });
        },
        error: (error) => {
          console.error('Error setting financial year on backend:', error);
        }
      });
    }
  }

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
