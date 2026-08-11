import { Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { FinancialYearService } from '../../services/financial-year.service';
import { StorageService } from '../../services/storage.service';
import { BalanceSheetService } from '../../services/balance-sheet.service';

@Component({
  selector: 'app-balance-sheet-horizontal',
  templateUrl: './balance-sheet-horizontal.component.html',
  styleUrls: ['./balance-sheet-horizontal.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ]
})
export class BalanceSheetHorizontalComponent implements OnInit {
  leftGroups: any[] = [];
  rightGroups: any[] = [];

  userId: number;
  financialYear: string;
  companyName: string;
  city: string;

  fromDate = new FormControl();
  toDate = new FormControl();
  financialYearstartDate: Date;
  financialYearendDate: Date;

  isGroupDrilldownActive = false;
  loading = true;

  constructor(
    private balanceSheetService: BalanceSheetService,
    private financialYearService: FinancialYearService,
    private storageService: StorageService,
    private datePipe: DatePipe
  ) { }

  ngOnInit(): void {
    this.getFinancialYear();
  }

  getFinancialYear(): void {
    const storedFinancialYear = this.financialYearService.getStoredFinancialYear();
    if (storedFinancialYear) {
      this.financialYear = storedFinancialYear;
      this.companyName = this.storageService.getUser().user_details.company_name;
      this.city = this.storageService.getUser().user_details.city;
      this.userId = this.storageService.getUser().id;

      const [startYear, endYear] = this.financialYear.split('-').map(Number);
      this.financialYearstartDate = new Date(startYear, 3, 1);
      this.financialYearendDate = new Date(endYear, 2, 31);
    }
  }

  dateFilter = (date: Date | null): boolean => {
    return !!date && date >= this.financialYearstartDate && date <= this.financialYearendDate;
  };

  loadReport(): void {
    const fromDateStr = this.datePipe.transform(this.fromDate.value, 'yyyy-MM-dd', 'en-IN')!;
    const toDateStr = this.datePipe.transform(this.toDate.value, 'yyyy-MM-dd', 'en-IN')!;

    this.balanceSheetService.getHorizontalReport(this.userId, fromDateStr, toDateStr, this.financialYear).subscribe({
      next: (data) => {
        this.leftGroups = data.left;
        this.rightGroups = data.right;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load balance sheet report', err);
        this.loading = false;
      }
    });
  }

  exportToPDF(): void {
    console.log('Export to PDF clicked');
  }

  handleBackToMainReport(): void {
    this.isGroupDrilldownActive = false;
  }

  get maxLengthArray(): any[] {
    const max = Math.max(this.leftGroups.length, this.rightGroups.length);
    return Array.from({ length: max });
  }

  get leftTotal(): number {
    return this.leftGroups.reduce((sum, g) => sum + (g?.outerAmount || 0), 0);
  }

  get rightTotal(): number {
    return this.rightGroups.reduce((sum, g) => sum + (g?.outerAmount || 0), 0);
  }

  getGroupClass(group: any): string {
    return group?.groupMode === 'structured'
      ? 'bg-structured'
      : group?.groupMode === 'flat'
        ? 'bg-flat'
        : 'bg-default';
  }
}
