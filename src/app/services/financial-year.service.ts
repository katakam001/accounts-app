// financial-year.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FinancialYearService {
  private financialYearSubject = new BehaviorSubject<string>('');
  financialYear$ = this.financialYearSubject.asObservable();

  setFinancialYear(year: string) {
    this.financialYearSubject.next(year);
  }
}
