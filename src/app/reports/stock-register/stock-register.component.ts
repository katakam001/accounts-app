import { Component, OnInit, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit } from '@angular/core';
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
import { StockRegisterChartComponent } from "../../charts/stock-register-chart/stock-register-chart.component";
import { ChartData } from 'chart.js';
import { ScrollingModule } from '@angular/cdk/scrolling'; // Import ScrollingModule

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
    MatProgressSpinnerModule,
    StockRegisterChartComponent,
    ScrollingModule // Include ScrollingModule
  ],
  templateUrl: './stock-register.component.html',
  styleUrls: ['./stock-register.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StockRegisterComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['Date', 'Item', 'Opening Stock', 'Purchase', 'Sale Return', 'Received From Process', 'Total', 'Sales', 'Purchase Return', 'Dispatch To Process', 'Closing Stock'];
  dataSource: MatTableDataSource<any>;
  items: any[] = [];
  selectedItemId: number;
  userId: number;
  financialYear: string;
  isLoading = false;

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
    private cdr: ChangeDetectorRef // Inject ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.userId = this.storageService.getUser().id;
    this.getFinancialYear();
    this.loadItems();
    
  }

  ngAfterViewInit() {
    console.log(this.sort); // Check if MatSort instance is available
    if (this.dataSource) {
      this.dataSource.sort = this.sort;
    }
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

  generateStockRegister(): void {
    if (this.selectedItemId) {
      this.isLoading = true;
      this.stockRegisterService.getStockRegister(this.financialYear, this.selectedItemId, this.userId).subscribe(
        (data: any[]) => {
          this.dataSource = new MatTableDataSource(data);
          console.log(this.dataSource); // Check if dataSource is set correctly
          this.dataSource.sort = this.sort;
          console.log(this.dataSource); // Check if dataSource is set correctly
          this.prepareChartData(data);
          this.isLoading = false;
          this.cdr.detectChanges(); // Manually trigger change detection
        },
        error => {
          console.error('Error fetching stock register data:', error);
          this.isLoading = false;
          this.cdr.detectChanges(); // Manually trigger change detection
        }
      );
    }
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
