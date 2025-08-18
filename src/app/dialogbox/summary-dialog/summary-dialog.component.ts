import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ChartConfiguration, ChartOptions, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { MatButtonToggleModule } from '@angular/material/button-toggle'; // Import MatButtonToggleModule
import { MatIconModule } from '@angular/material/icon';
@Component({
  selector: 'app-summary-dialog',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, MatButtonToggleModule, MatIconModule],
  templateUrl: './summary-dialog.component.html',
  styleUrls: ['./summary-dialog.component.css'],
})
export class SummaryDialogComponent implements OnInit {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective; // Access to the chart instance
  pageSummary: { [key: number]: any } = {};
  totalSummary: any[];
  currentView: 'total' | 'page' = 'total'; // Toggle between views
  public stackedChartData!: ChartConfiguration<'bar'>['data'];
  public stackedChartOptions!: ChartOptions<'bar'>;
  constructor(
    private dialogRef: MatDialogRef<SummaryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.pageSummary = data.pageSummary; // Page summary from the parent component
    this.totalSummary = data.totalSummary; // Total summary from the backend
  }

  ngOnInit(): void {
    this.prepareChartData();
    this.refreshChartOnOpen();
  }
  refreshChartOnOpen(): void {
    setTimeout(() => {
      this.chart?.update(); // Force the chart to refresh and resize
    }, 0);
  }

  prepareChartData(): void {
    // Extract unique tax field names for datasets
    const taxFieldNames = new Set<string>();
    this.totalSummary.forEach((item) => {
      item.tax_details.forEach((tax: any) => {
        taxFieldNames.add(tax.field_name); // Collect unique tax names
      });
    });

    const taxFieldsArray = Array.from(taxFieldNames);

    // Generate datasets for taxes
    const taxDatasets = taxFieldsArray.map((taxName) => ({
      label: taxName,
      backgroundColor: this.getRandomColor(),
      data: this.totalSummary.map((item) => {
        const taxDetail = item.tax_details.find(
          (tax: any) => tax.field_name === taxName
        );
        return taxDetail ? taxDetail.total_field_value : 0; // Default to 0 for missing tax types
      })
    }));

    // Add Total Value and Total Amount datasets
    const additionalDatasets = [
      {
        label: 'Total Value',
        backgroundColor: 'rgba(75, 192, 192, 0.6)', // Fixed color
        data: this.totalSummary.map((item) => parseFloat(item.total_value) || 0)
      }
    ];

    // Combine all datasets (Taxes + Total Value + Total Amount)
    this.stackedChartData = {
      labels: this.totalSummary.map((item) => item.category_account_name), // X-Axis labels
      datasets: [...taxDatasets, ...additionalDatasets]
    };

    this.stackedChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          stacked: true,
          title: {
            display: true,
            text: 'Categories',
            font: {
              size: 14,
              weight: 'bold',
            },
          },
        },
        y: {
          stacked: true,
          title: {
            display: true,
            text: 'Values (₹)',
            font: {
              size: 14,
              weight: 'bold',
            },
          },
          ticks: {
            callback: (value) => `₹${value.toLocaleString()}`, // Format tick labels as currency
          },
          grid: {
            color: 'rgba(200, 200, 200, 0.2)', // Subtle grid lines
          },
          max: Math.max(...this.totalSummary.map((item) =>
            parseFloat(item.total_amount || 0)
          )) * 1.1, // Increase the max by 10% to create padding
        },
      },
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            font: {
              size: 12,
            },
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.dataset.label || '';
              const value = context.raw as number;
              return `${label}: ₹${value.toLocaleString()}`; // Format tooltip values
            },
          },
        },
      },
    };
  }

  getRandomColor(): string {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  formatCurrency(value: any): string {
    const num = parseFloat(value);
    return isNaN(num)
      ? ''
      : new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num);
  }

}
