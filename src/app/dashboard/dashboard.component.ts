import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FinancialYearService } from '../services/financial-year.service';
import { MatDialog } from '@angular/material/dialog';
import { FinancialYearDialogComponent } from '../dialogbox/financial-year-dialog/financial-year-dialog.component';
import { ChartConfiguration, ChartOptions, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { EntryService } from '../services/entry.service';
import { StorageService } from '../services/storage.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  financialYear: string;
  public barChartType: 'bar' = 'bar';
  // Graph configurations
  public barChartData!: ChartConfiguration<'bar'>['data'];
  public barChartOptions!: ChartOptions<'bar'>;
  typeDescriptions: { [key: number]: string } = {
    1: 'Purchase',
    2: 'Sale',
    3: 'Purchase Return',
    4: 'Sale Return',
    5: 'Credit Note',
    6: 'Debit Note',
  };

  constructor(private dialog: MatDialog, private datePipe: DatePipe,
    private financialYearService: FinancialYearService, private entryService: EntryService, private storageService: StorageService) { }

  ngOnInit(): void {
    this.getFinancialYear();
  }

  getFinancialYear() {
    const storedFinancialYear = this.financialYearService.getStoredFinancialYear();
    if (storedFinancialYear) {
      this.financialYear = storedFinancialYear;
      const [startYear, endYear] = this.financialYear.split('-').map(Number);
      const financialYearstartDate = new Date(startYear, 3, 1); // April 1st of start year
      const financialYearendDate = new Date(endYear, 2, 31); // March 31st of end year
      const fromDateStr = this.datePipe.transform(financialYearstartDate, 'yyyy-MM-dd', 'en-IN') as string; // Transform to desired format
      const toDateStr = this.datePipe.transform(financialYearendDate, 'yyyy-MM-dd', 'en-IN') as string; // Transform to desired format  
      this.entryService.getEntryTypeSummary(this.storageService.getUser().id, this.financialYear, fromDateStr || undefined, toDateStr || undefined).subscribe(data => {
        // Parse response into numerical format
        const colors = data.map(() => this.getRandomColor());

        const labels = data.map((item: any) => {
          return `${this.typeDescriptions[item.type]}`;
        });
        const totalAmounts = data.map((item: any) => parseFloat(item.total_amount_sum));

        // Calculate the max value with a buffer
        const maxValue = Math.max(...totalAmounts);
        const yAxisMax = maxValue + maxValue * 0.1; // Add 10% buffer
        this.barChartData = {
          labels: labels,
          datasets: [
            {
              data: totalAmounts,
              label: 'Total Amount (₹)',
              backgroundColor: colors, // Generate random color for each type
              hoverBackgroundColor: colors, // Optional: Random hover color for each type
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
                // Show type descriptions with assigned colors in legend
                generateLabels: (chart) => {
                  return data.map((item: any, index: number) => ({
                    text: `${this.typeDescriptions[item.type]}`,
                    fillStyle: colors[index], // Assign the matching color
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
                font: {
                  size: 16,
                  weight: 'bold',
                },
              },
            },
            y: {
              title: {
                display: true,
                text: 'Total Amount (₹)',
                font: {
                  size: 16,
                  weight: 'bold',
                },
              },
              ticks: {
                callback: (value) => `₹${value.toLocaleString()}`,
              },
              max: yAxisMax, // Dynamically calculated max value
            },
          },
        };
      });

    }
  }
  // Helper function to generate random colors
  getRandomColor(): string {
    // Vibrant and modern color palette inspired by design trends
    const vibrantColors = [
      '#FF4500', // Bold Orange-Red
      '#1E90FF', // Dodger Blue
      '#32CD32', // Lime Green
      '#FFD700', // Golden Yellow
      '#FF1493', // Deep Pink
      '#00CED1', // Dark Turquoise
      '#FF6347', // Tomato Red
      '#8A2BE2', // Blue Violet
      '#40E0D0', // Turquoise
      '#DC143C', // Crimson
      '#7FFF00', // Chartreuse
      '#FF69B4', // Hot Pink
    ];
  
    // Pick a random color from the vibrant palette
    return vibrantColors[Math.floor(Math.random() * vibrantColors.length)];
  }
  
   
  openFinancialYearDialog() {
    const dialogRef = this.dialog.open(FinancialYearDialogComponent);

    dialogRef.afterClosed().subscribe(() => {
      this.getFinancialYear(); // Fetch the financial year from local storage and update
    });
  }
}
