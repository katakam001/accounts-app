import { Component, OnInit, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule, DatePipe } from '@angular/common';
import { StockRegisterService } from '../../services/stock-register.service';
import { FinancialYearService } from '../../services/financial-year.service';
import { StorageService } from '../../services/storage.service';
import { ItemsService } from '../../services/items.service';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ChartData } from 'chart.js';
import { MatDialog } from '@angular/material/dialog';
import { StockRegisterChartDialogComponent } from '../../dialogbox/stock-register-chart-dialog/stock-register-chart-dialog.component';

@Component({
  selector: 'app-stock-register',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatCardModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './stock-register.component.html',
  styleUrls: ['./stock-register.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StockRegisterComponent implements OnInit {
  displayedColumns: string[] = ['Date', 'Item', 'Opening Stock', 'Purchase', 'Sale Return', 'Received From Process', 'Total', 'Sales', 'Purchase Return', 'Dispatch To Process', 'Closing Stock'];
  dataSource = new MatTableDataSource<any>();
  columnTotals: { [key: string]: number } = {};
  summaryColumns = [
    'Purchase',
    'Sale Return',
    'Received From Process',
    'Sales',
    'Purchase Return',
    'Dispatch To Process'
  ];
  amountColumns = [
    'Opening Stock',
    'Purchase',
    'Sale Return',
    'Received From Process',
    'Total',
    'Sales',
    'Purchase Return',
    'Dispatch To Process',
    'Closing Stock'
  ];
  selectedMonth: number | null = null; // null means full financial year
  months = [
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' }
  ];
  monthLabel: { [key: number]: string } = {
    1: 'January',
    2: 'February',
    3: 'March',
    4: 'April',
    5: 'May',
    6: 'June',
    7: 'July',
    8: 'August',
    9: 'September',
    10: 'October',
    11: 'November',
    12: 'December'
  };
  items: any[] = [];
  selectedItemId: number;
  userId: number;
  financialYear: string;
  isLoading = false;
  isStockGenerated = false;
  public chartLabels: string[] = [];
  public chartData: ChartData<'line'> = {
    labels: this.chartLabels,
    datasets: [{ data: [], label: 'Closing Stock' }]
  };

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private stockRegisterService: StockRegisterService,
    private financialYearService: FinancialYearService,
    private storageService: StorageService,
    private itemsService: ItemsService,
    public dialog: MatDialog,
    private cdr: ChangeDetectorRef // Inject ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.userId = this.storageService.getUser().id;
    this.getFinancialYear();
    this.loadItems();

  }

  getFinancialYear() {
    const storedFinancialYear = this.financialYearService.getStoredFinancialYear();
    if (storedFinancialYear) {
      this.financialYear = storedFinancialYear;
    }
  }

  loadItems(): void {
    this.itemsService.getItemsByUserIdAndFinancialYear(this.userId, this.financialYear).subscribe(
      (data: any[]) => {
        this.items = data;
        this.cdr.markForCheck(); // Manually trigger change detection
      },
      error => {
        console.error('Error loading items:', error);
      }
    );
  }

  openChartDialog(): void {
    const dialogPayload = {
      chartData: this.chartData,
      viewType: this.selectedMonth ? 'monthly' : 'financial_year',
      contextLabel: this.selectedMonth
        ? `${this.monthLabel[this.selectedMonth]} (${this.financialYear})`
        : `Full Financial Year (${this.financialYear})`
    };

    this.dialog.open(StockRegisterChartDialogComponent, {
      width: '90%',
      data: dialogPayload
    });
  }

  generateStockRegister(): void {
    if (!this.selectedItemId) return;

    this.isLoading = true;
    this.isStockGenerated = false;

    this.stockRegisterService
      .getStockRegister(this.financialYear, this.selectedItemId, this.userId, this.selectedMonth ?? undefined)
      .subscribe(
        (data: any[]) => {
          this.dataSource.data = data;
          this.columnTotals = {};
          this.summaryColumns.forEach(col => {
            const total = data.reduce((sum, row) => {
              const value = parseFloat(row[col] || '0');
              return sum + value;
            }, 0);
            this.columnTotals[col] = total.toFixed(4); // store as string with 4 decimals
          });
          console.log(this.columnTotals);
          setTimeout(() => {
            this.dataSource.sort = this.sort;
          });

          this.prepareChartData(data); // Optional: chart logic
          this.isLoading = false;
          this.isStockGenerated = true;
          this.cdr.detectChanges();
        },
        error => {
          console.error('❌ Error fetching stock register data:', error);
          this.isLoading = false;
          this.isStockGenerated = false;
          this.cdr.detectChanges();
        }
      );
  }

  trackById(index: number, item: any): number {
    return item.id;
  }

  prepareChartData(data: any[]): void {
    this.chartData = {
      labels: [],
      datasets: [{
        data: [],
        label: 'Closing Stock',
        fill: false,
        borderColor: [], // Initialize as an empty array
        tension: 0.1
      }]
    };

    data.forEach(record => {
      const date = new Date(record.Date);
      const isoDate = date.toISOString(); // Format date as ISO string
      this.chartData.labels?.push(isoDate);
      this.chartData.datasets[0].data?.push(record['Closing Stock']);

      // Set the border color based on the closing stock value
      const color = record['Closing Stock'] < 0 ? 'rgb(255, 204, 204)' : 'rgb(204, 255, 204)';
      (this.chartData.datasets[0].borderColor as string[]).push(color); // Assert borderColor as string[]
    });

    this.cdr.detectChanges(); // Manually trigger change detection after preparing chart data
  }

  exportToExcel() {
    const formattedData = this.dataSource.data.map(record => ({
      ...record,
      Date: new DatePipe('en-US').transform(record.Date, 'dd-MM-yyyy')
    }));
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stock Register');
    XLSX.writeFile(wb, 'StockRegister.xlsx');
  }

  exportToPDF() {
    const doc = new jsPDF('landscape'); // Set orientation to landscape
    doc.setFontSize(18);
    doc.text('Stock Register for Item: ' + this.selectedItemId, 14, 22); // Add item name to header
    doc.setFontSize(12);
    doc.text(`Generated on: ${new DatePipe('en-US').transform(new Date(), 'dd-MM-yyyy')}`, 14, 30);

    const data = this.dataSource.data.map(record => {
      const rowColor = record['Closing Stock'] < 0 ? [255, 204, 204] : [204, 255, 204]; // Light red for negative, light green for positive
      return [
        { content: new DatePipe('en-US').transform(record.Date, 'dd-MM-yyyy'), styles: { fillColor: rowColor as [number, number, number] } },
        { content: record['Opening Stock'], styles: { fillColor: rowColor as [number, number, number] } },
        { content: record.Purchase, styles: { fillColor: rowColor as [number, number, number] } },
        { content: record['Sale Return'], styles: { fillColor: rowColor as [number, number, number] } },
        { content: record['Received From Process'], styles: { fillColor: rowColor as [number, number, number] } },
        { content: record.Total, styles: { fillColor: rowColor as [number, number, number] } },
        { content: record.Sales, styles: { fillColor: rowColor as [number, number, number] } },
        { content: record['Purchase Return'], styles: { fillColor: rowColor as [number, number, number] } },
        { content: record['Dispatch To Process'], styles: { fillColor: rowColor as [number, number, number] } },
        { content: record['Closing Stock'], styles: { fillColor: rowColor as [number, number, number] } }
      ];
    });

    autoTable(doc, {
      startY: 40, // Adjust start position to avoid overlapping with header
      head: [['Date', 'Opening Stock', 'Purchase', 'Sale Return', 'Received From Process', 'Total', 'Sales', 'Purchase Return', 'Dispatch To Process', 'Closing Stock']],
      body: data,
      styles: {
        lineWidth: 0.1, // Add border width
        lineColor: [0, 0, 0] // Add border color
      },
      columnStyles: {
        0: { cellWidth: 22, halign: 'center' }, // Date
        1: { cellWidth: 30, halign: 'center' }, // Opening Stock
        2: { cellWidth: 25, halign: 'center' }, // Purchase
        3: { cellWidth: 25, halign: 'center' }, // Sale Return
        4: { cellWidth: 25, halign: 'center' }, // Received From Process
        5: { cellWidth: 30, halign: 'center' }, // Total
        6: { cellWidth: 25, halign: 'center' }, // Sales
        7: { cellWidth: 25, halign: 'center' }, // Purchase Return
        8: { cellWidth: 25, halign: 'center' }, // Dispatch To Process
        9: { cellWidth: 30, halign: 'center' } // Closing Stock
      },
      headStyles: {
        cellWidth: 20,
        minCellHeight: 10,
        halign: 'center',
        valign: 'middle',
        fontSize: 10,
        cellPadding: 2,
        overflow: 'linebreak'
      },
      bodyStyles: {
        halign: 'center' // Center-align cell values
      }
    });

    const timestamp = new DatePipe('en-US').transform(new Date(), 'dd-MM-yyyy_HH-mm-ss');
    doc.save(`StockRegister_${timestamp}.pdf`);
  }
}
