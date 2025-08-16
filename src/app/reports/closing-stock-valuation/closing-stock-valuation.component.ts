import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { ClosingStockValuationService } from '../../services/closing-stock-valuation.service';
import { EditClosingStockDialogComponent } from '../../dialogbox/edit-closing-stock-dialog/edit-closing-stock-dialog.component';
import { StorageService } from '../../services/storage.service';
import { FinancialYearService } from '../../services/financial-year.service';
import { CommonModule, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatDialogModule } from '@angular/material/dialog';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-closing-stock-valuation',
  templateUrl: './closing-stock-valuation.component.html',
  styleUrls: ['./closing-stock-valuation.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule
  ]
})
export class ClosingStockValuationComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['itemName', 'value', 'isManual', 'actions'];
  dataSource = new MatTableDataSource<any>();
  userId: number;
  financialYear: string;
  fromDate = new FormControl();
  toDate = new FormControl();
  financialYearstartDate: Date;
  financialYearendDate: Date;
    isLoading = false;

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private closingStockValuationService: ClosingStockValuationService,
    private financialYearService: FinancialYearService,
    private storageService: StorageService,
    private datePipe: DatePipe,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.getFinancialYear();
    this.applyFilter();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  getFinancialYear() {
    const storedFinancialYear = this.financialYearService.getStoredFinancialYear();
    if (storedFinancialYear) {
      this.financialYear = storedFinancialYear;
      this.userId = this.storageService.getUser().id;
      const [startYear, endYear] = this.financialYear.split('-').map(Number);
      this.financialYearstartDate = new Date(startYear, 3, 1); // April 1st of start year
      this.financialYearendDate = new Date(endYear, 2, 31); // March 31st of end year
      this.fromDate.patchValue(this.financialYearstartDate);
      this.toDate.patchValue(this.financialYearendDate);
    }
  }
  dateFilter = (date: Date | null): boolean => {
    if (!date) {
      return false; // Ignore null dates
    }

    // Return whether the date falls within the financial year range
    return date >= this.financialYearstartDate && date <= this.financialYearendDate;
  };

  applyFilter(): void {
    const fromDateStr = this.datePipe.transform(this.fromDate.value, 'yyyy-MM-dd', 'en-IN') as string;
    const toDateStr = this.datePipe.transform(this.toDate.value, 'yyyy-MM-dd', 'en-IN') as string;

    if (fromDateStr && toDateStr) {
            this.isLoading = true;
             this.closingStockValuationService.generateClosingStock(this.userId, this.financialYear, fromDateStr, toDateStr)
        .subscribe({
          next: (data: any[]) => {
            this.dataSource.data = data;
            this.isLoading = false;
          },
          error: () => {
            this.isLoading = false;
          }
        });
    }
  }


  openEditDialog(stock: any): void {
    const dialogRef = this.dialog.open(EditClosingStockDialogComponent, {
      width: '400px',
      data: { stock }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.updateStock(result);
    });
  }

  updateStock(stock: any): void {
    this.closingStockValuationService.updateClosingStock(stock).subscribe(response => {
      const index = this.dataSource.data.findIndex(s => s.id === response.id);
      if (index !== -1) {
        this.dataSource.data[index] = response;
        this.dataSource.data = [...this.dataSource.data];
        this.sortAndRefresh();
      }
    });
  }

  private sortAndRefresh(): void {
    const sort = this.dataSource.sort;
    if (sort) {
      sort.sort({ id: sort.active || 'itemName', start: sort.direction || 'asc', disableClear: false });
    }
  }
}
