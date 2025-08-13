import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { OpeningStockService } from '../../services/opening-stock.service';
import { AddEditOpeningStockDialogComponent } from '../../dialogbox/add-edit-opening-stock-dialog/add-edit-opening-stock-dialog.component';
import { StorageService } from '../../services/storage.service';
import { FinancialYearService } from '../../services/financial-year.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-opening-stock',
  templateUrl: './opening-stock.component.html',
  styleUrls: ['./opening-stock.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatCardModule
  ]
})
export class OpeningStockComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['itemName', 'quantity', 'rate', 'value', 'actions'];
  dataSource = new MatTableDataSource<any>();
  userId: number;
  financialYear: string;

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private openingStockService: OpeningStockService,
    private financialYearService: FinancialYearService,
    private storageService: StorageService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.userId = this.storageService.getUser().id;
    this.getFinancialYear();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }
  getFinancialYear() {
    const storedFinancialYear = this.financialYearService.getStoredFinancialYear();
    if (storedFinancialYear) {
      this.financialYear = storedFinancialYear;
      this.loadOpeningStock();
    }
  }

  loadOpeningStock(): void {
    this.openingStockService.getOpeningStockByUserIdAndFinancialYear(this.userId, this.financialYear).subscribe((data: any[]) => {
      this.dataSource.data = data;
    });
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(AddEditOpeningStockDialogComponent, {
      width: '400px',
      data: { stock: null, userId: this.userId, financialYear: this.financialYear }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.addStock(result);
    });
  }

  openEditDialog(stock: any): void {
    const dialogRef = this.dialog.open(AddEditOpeningStockDialogComponent, {
      width: '400px',
      data: { stock, userId: this.userId, financialYear: this.financialYear }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.updateStock(result);
    });
  }

  addStock(stock: any): void {
    this.openingStockService.add(stock).subscribe(response => {
      this.dataSource.data = [...this.dataSource.data, response];
      this.sortAndRefresh();
    });
  }

  updateStock(stock: any): void {
    this.openingStockService.update(stock.id, stock).subscribe(response => {
      const index = this.dataSource.data.findIndex(s => s.id === response.id);
      if (index !== -1) {
        this.dataSource.data[index] = response;
        this.dataSource.data = [...this.dataSource.data];
        this.sortAndRefresh();
      }
    });
  }

  deleteStock(id: number): void {
    this.openingStockService.delete(id).subscribe(() => {
      this.dataSource.data = this.dataSource.data.filter(s => s.id !== id);
      this.sortAndRefresh();
    });
  }

  private sortAndRefresh(): void {
    const sort = this.dataSource.sort;
    if (sort) {
      sort.sort({ id: sort.active || 'itemName', start: sort.direction || 'asc', disableClear: false });
    }
  }
}
