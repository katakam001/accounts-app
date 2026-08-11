import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { FinancialYearService } from '../../../services/financial-year.service';
import { StorageService } from '../../../services/storage.service';
import { ProfitLossComponent } from '../../profit-loss/profit-loss.component';
import { TradingAccountComponent } from '../../trading-account/trading-account.component';
import { CombinedReportService } from '../../../services/combined-report.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UploadService } from '../../../services/upload.service';

@Component({
  selector: 'app-trading-account-profit-loss',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    TradingAccountComponent,
    ProfitLossComponent
  ],
  templateUrl: './trading-account-profit-loss.component.html',
  styleUrl: './trading-account-profit-loss.component.css'
})
export class TradingAccountProfitLossComponent implements OnInit {
  fromDate = new FormControl();
  toDate = new FormControl();
  financialYear: string;
  userId: number;
  companyName: string;
  city: string;
  financialYearstartDate: Date;
  financialYearendDate: Date;
  isGroupDrilldownActive = false;

  tradingData: any = null;
  profitLossData: any = null;

  constructor(
    private reportService: CombinedReportService,
    private financialYearService: FinancialYearService,
    private snackBar: MatSnackBar,
    private uploadService: UploadService,
    private storageService: StorageService,
    private datePipe: DatePipe
  ) { }

  ngOnInit(): void {
    this.getFinancialYear();
  }

  getFinancialYear() {
    const storedFY = this.financialYearService.getStoredFinancialYear();
    if (storedFY) {
      this.financialYear = storedFY;
      this.userId = this.storageService.getUser().id;
      this.companyName = this.storageService.getUser().user_details.company_name;
      this.city = this.storageService.getUser().user_details.city;
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

    this.reportService.getTradingAccountAndProfitAndLossReport(this.userId, fromDateStr, toDateStr, this.financialYear).subscribe({
      next: (data) => {
        this.tradingData = data.trading;
        this.profitLossData = data.profitLoss;
      },
      error: (err) => {
        console.error('Failed to load combined report', err);
      }
    });
  }

  exportToPDF(): void {
    const fromDateStr = this.datePipe.transform(this.fromDate.value, 'yyyy-MM-dd', 'en-IN') as string;
    const toDateStr = this.datePipe.transform(this.toDate.value, 'yyyy-MM-dd', 'en-IN') as string;

    this.reportService.exportTradingAccountAndProfitAndLossToPDF(this.userId, this.financialYear, this.companyName, this.city, fromDateStr, toDateStr).subscribe({
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
    this.isGroupDrilldownActive = false;
  }
}