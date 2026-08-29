import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FinancialYearService } from '../services/financial-year.service';
import { MatDialog } from '@angular/material/dialog';
import { FinancialYearDialogComponent } from '../dialogbox/financial-year-dialog/financial-year-dialog.component';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { EntryService } from '../services/entry.service';
import { StorageService } from '../services/storage.service';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  financialYear: string;
  financialYearStatus: string | null = null;
  financialYearError: string | null = null;

  isImpersonated = false;
  public barChartType: 'bar' = 'bar';
  public barChartData!: ChartConfiguration<'bar'>['data'];
  public barChartOptions!: ChartOptions<'bar'>;

  typeDescriptions: { [key: number]: string } = {
    1: 'Purchase',
    2: 'Sale',
    3: 'Purchase Return',
    4: 'Sale Return',
    5: 'Credit Note',
    6: 'Debit Note',
    8: 'Cash Sale',
  };

  constructor(
    private dialog: MatDialog,
    private datePipe: DatePipe,
    private financialYearService: FinancialYearService,
    private entryService: EntryService,
    private storageService: StorageService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.isImpersonated = this.storageService.isImpersonating();
    this.getFinancialYear();
  }

  backToAdmin(): void {
    this.storageService.clearImpersonationState();
    this.router.navigate(['/user-list']);
  }

  getFinancialYear() {
    const storedFinancialYear = this.financialYearService.getStoredFinancialYear();
    if (storedFinancialYear) {
      this.financialYear = storedFinancialYear;

      // Fetch backend status + error
      this.financialYearService.setFinancialYearBackend(this.financialYear).subscribe(res => {
        this.financialYearStatus = this.mapStatus(res.status);
        this.financialYearError = res.error_message;

        // Only load chart if status is Ready
        if (res.status === 3) {
          this.loadEntrySummary();
        }
      });
    }
  }

  loadEntrySummary() {
    const [startYear, endYear] = this.financialYear.split('-').map(Number);
    const financialYearstartDate = new Date(startYear, 3, 1); // April 1st
    const financialYearendDate = new Date(endYear, 2, 31);   // March 31st

    const fromDateStr = this.datePipe.transform(financialYearstartDate, 'yyyy-MM-dd', 'en-IN') as string;
    const toDateStr = this.datePipe.transform(financialYearendDate, 'yyyy-MM-dd', 'en-IN') as string;

    this.entryService.getEntryTypeSummary(
      this.storageService.getUser().id,
      this.financialYear,
      fromDateStr,
      toDateStr
    ).subscribe(data => {
      const colors = data.map(() => this.getRandomColor());
      const labels = data.map((item: any) => this.typeDescriptions[item.type]);
      const totalAmounts = data.map((item: any) => parseFloat(item.total_amount_sum));

      const maxValue = Math.max(...totalAmounts);
      const yAxisMax = maxValue + maxValue * 0.1;

      this.barChartData = {
        labels,
        datasets: [
          {
            data: totalAmounts,
            label: 'Total Amount (₹)',
            backgroundColor: colors,
            hoverBackgroundColor: colors,
          },
        ],
      };

      this.barChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              generateLabels: (chart) => {
                return data.map((item: any, index: number) => ({
                  text: `${this.typeDescriptions[item.type]}`,
                  fillStyle: colors[index],
                  hidden: false,
                }));
              }
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                const value = context.raw as number;
                return `${label}: ₹${value.toLocaleString()}`;
              },
            },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Entry Types',
              font: { size: 16, weight: 'bold' },
            },
          },
          y: {
            title: {
              display: true,
              text: 'Total Amount (₹)',
              font: { size: 16, weight: 'bold' },
            },
            ticks: {
              callback: (value) => `₹${value.toLocaleString()}`,
            },
            max: yAxisMax,
          },
        },
      };
    });
  }

  getRandomColor(): string {
    const vibrantColors = [
      '#FF4500', '#1E90FF', '#32CD32', '#FFD700',
      '#FF1493', '#00CED1', '#FF6347', '#8A2BE2',
      '#40E0D0', '#DC143C', '#7FFF00', '#FF69B4',
    ];
    return vibrantColors[Math.floor(Math.random() * vibrantColors.length)];
  }

  openFinancialYearDialog() {
    const dialogRef = this.dialog.open(FinancialYearDialogComponent);

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.financialYear = result.financialYear;
        this.financialYearStatus = result.status;
        this.financialYearError = result.error;
      }
      this.getFinancialYear();
    });
  }

  mapStatus(status: number): string {
    switch (status) {
      case 1: return 'Seeded';
      case 2: return 'Processing';
      case 3: return 'Ready';
      case 4: return 'Failed';
      default: return 'Unknown';
    }
  }
}
