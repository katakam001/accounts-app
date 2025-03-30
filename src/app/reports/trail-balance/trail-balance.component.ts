import { Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TrailBalanceReport } from '../../models/trail-balance-report.model';
import { TrailBalanceService } from '../../services/trail-balance.service';
import { StorageService } from '../../services/storage.service';
import { FinancialYearService } from '../../services/financial-year.service';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-trail-balance',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule,MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule],
  templateUrl: './trail-balance.component.html',
  styleUrls: ['./trail-balance.component.css']
})
export class TrailBalanceComponent implements OnInit {
  trailBalanceReport: TrailBalanceReport[] = [];
  userId: number;
  financialYear: string;
  fromDate = new FormControl();
  toDate = new FormControl();
  financialYearstartDate: Date;
  financialYearendDate: Date; 
  constructor(
    private trailBalanceService: TrailBalanceService,
    private financialYearService: FinancialYearService,
    private storageService: StorageService,
    private datePipe: DatePipe,
    private router: Router // Inject Router
  ) { }

  ngOnInit(): void {
    this.getFinancialYear();
  }

  getFinancialYear() {
    const storedFinancialYear = this.financialYearService.getStoredFinancialYear();
    if (storedFinancialYear) {
      this.financialYear = storedFinancialYear;
      this.userId = this.storageService.getUser().id;
      const [startYear, endYear] = this.financialYear.split('-').map(Number);
      this.financialYearstartDate = new Date(startYear, 3, 1); // April 1st of start year
      this.financialYearendDate = new Date(endYear, 2, 31); // March 31st of end year
      // this.fromDate.setValue(startDate);
      // this.toDate.setValue(endDate);
      // this.getTrailBalanceReport();
    }
  }
  dateFilter = (date: Date | null): boolean => {
    if (!date) {
      return false; // Ignore null dates
    }
  
    // Return whether the date falls within the financial year range
    return date >= this.financialYearstartDate && date <= this.financialYearendDate;
  }; 

  getTrailBalanceReport(): void {
    const fromDateStr = this.datePipe.transform(this.fromDate.value, 'yyyy-MM-dd', 'en-IN') as string;
    const toDateStr = this.datePipe.transform(this.toDate.value, 'yyyy-MM-dd', 'en-IN') as string;
    this.trailBalanceService.getTrailBalanceReport(this.userId, fromDateStr, toDateStr,this.financialYear).subscribe((data: TrailBalanceReport[]) => {
      this.trailBalanceReport = data.map(entry => ({
        ...entry,
        totalDebit: this.formatNumber(Number(entry.totalDebit)),
        totalCredit: this.formatNumber(Number(entry.totalCredit)),
        balance: this.formatNumber(Number(entry.balance))
      }));
    });
  }

  navigateToJournalEntry(accountId: number | null, groupId: number,groupName:string): void {
    console.log(accountId);
    console.log(groupId);
    if (groupName === 'Sundry Debtors' || groupName === 'Sundry Creditors') {
      this.router.navigate(['/journalEntries'], { queryParams: { groupId: groupId } });
    } else {
      this.router.navigate(['/journalEntries'], { queryParams: { accountId: accountId } });
    }
  }
  

  formatNumber(value: number): string {
    return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  }
}
