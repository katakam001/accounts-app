import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TradingAccountComponent } from '../trading-account.component';
import { TradingReportService } from '../../../services/trading-report.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FinancialYearService } from '../../../services/financial-year.service';
import { StorageService } from '../../../services/storage.service';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UploadService } from '../../../services/upload.service';

@Component({
  selector: 'app-trading-account-page',
  templateUrl: './trading-account-page.component.html',
  styleUrls: ['./trading-account-page.component.css'],
  standalone: true,
  imports: [CommonModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    TradingAccountComponent]
})
export class TradingAccountPageComponent implements OnInit {
  tradingData: any = null;
  loading = true;
  userId: number;
  financialYear: string;
  companyName: string;
  city: string;
  fromDate = new FormControl();
  toDate = new FormControl();
  financialYearstartDate: Date;
  financialYearendDate: Date;
  isGroupDrilldownActive = false; // placeholder for future drilldown

  constructor(private reportService: TradingReportService, private financialYearService: FinancialYearService,
    private storageService: StorageService,
    private snackBar: MatSnackBar,
    private uploadService: UploadService,
    private datePipe: DatePipe,) { }

  ngOnInit(): void {
    this.getFinancialYear();
  }

  getFinancialYear() {
    const storedFinancialYear = this.financialYearService.getStoredFinancialYear();
    if (storedFinancialYear) {
      this.financialYear = storedFinancialYear;
      this.companyName = this.storageService.getUser().user_details.company_name;
      this.city = this.storageService.getUser().user_details.city;
      this.userId = this.storageService.getUser().id;
      const [startYear, endYear] = this.financialYear.split('-').map(Number);
      this.financialYearstartDate = new Date(startYear, 3, 1); // April 1st of start year
      this.financialYearendDate = new Date(endYear, 2, 31); // March 31st of end year
    }
  }
  dateFilter = (date: Date | null): boolean => {
    if (!date) {
      return false; // Ignore null dates
    }

    // Return whether the date falls within the financial year range
    return date >= this.financialYearstartDate && date <= this.financialYearendDate;
  };

  loadReport(): void {
    const fromDateStr = this.datePipe.transform(this.fromDate.value, 'yyyy-MM-dd', 'en-IN') as string;
    const toDateStr = this.datePipe.transform(this.toDate.value, 'yyyy-MM-dd', 'en-IN') as string;

    this.reportService.getTradingReport(this.userId, fromDateStr, toDateStr, this.financialYear).subscribe({
      next: (data) => {
        this.tradingData = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load trading report', err);
        this.loading = false;
      }
    });
  }

  exportToPDF(): void {
    const fromDateStr = this.datePipe.transform(this.fromDate.value, 'yyyy-MM-dd', 'en-IN') as string;
    const toDateStr = this.datePipe.transform(this.toDate.value, 'yyyy-MM-dd', 'en-IN') as string;

    this.reportService.exportTradingAccountToPDF(this.userId, this.financialYear, this.companyName, this.city, fromDateStr, toDateStr).subscribe({
      next: data => {
        console.log(data);
        this.snackBar.open('Pdf generation is started please check the status in Download screen.', 'Close', {
          duration: 3000,
        });
        // Step 3: Call Start Monitoring API here
        this.uploadService.startMonitoring().subscribe(
          () => console.log('Monitoring started successfully!'),
          error => console.error('Error starting monitoring:', error)
        );
      },
      error: err => {
        console.error('Error impersonating user:', err);
      }
    });
  }

  handleBackToMainReport(): void {
    // Placeholder for future drilldown navigation
    this.isGroupDrilldownActive = false;
  }
}
