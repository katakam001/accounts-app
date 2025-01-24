import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { CommonModule } from '@angular/common';
import { ConversionService } from '../../services/conversion.service';
import { AddEditConversionDialogComponent } from '../../dialogbox/add-edit-conversion-dialog/add-edit-conversion-dialog.component';
import { FinancialYearService } from '../../services/financial-year.service';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-conversion',
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
    MatListModule
  ],
  templateUrl: './conversion.component.html',
  styleUrls: ['./conversion.component.css']
})
export class ConversionComponent implements OnInit {
  displayedColumns: string[] = ['fromUnit', 'toUnit', 'rate', 'actions'];
  dataSource: MatTableDataSource<any>;
  conversions: any[] = [];
  userId: number;
  financialYear: string;

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private conversionService: ConversionService,
    private financialYearService: FinancialYearService,
    private storageService: StorageService,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.userId = this.storageService.getUser().id;
    this.getFinancialYear();
  }

  getFinancialYear() {
    const storedFinancialYear = this.financialYearService.getStoredFinancialYear();
    if (storedFinancialYear) {
      this.financialYear = storedFinancialYear;
      this.loadConversions();
    }
  }

  loadConversions(): void {
    this.conversionService.getConversionsByUserIdAndFinancialYear(this.userId, this.financialYear).subscribe((data: any[]) => {
      this.conversions = data;
      this.dataSource = new MatTableDataSource(this.conversions);
      this.dataSource.sort = this.sort;
    });
  }

  openAddConversionDialog(): void {
    const dialogRef = this.dialog.open(AddEditConversionDialogComponent, {
      width: '800px',
      data: { conversion: null, userId: this.userId, financialYear: this.financialYear }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadConversions();
      }
    });
  }

  openEditConversionDialog(conversionData: any): void {
    const dialogRef = this.dialog.open(AddEditConversionDialogComponent, {
      width: '800px',
      data: { conversion: conversionData, userId: this.userId, financialYear: this.financialYear }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadConversions();
      }
    });
  }

  deleteConversion(conversionId: number): void {
    this.conversionService.deleteConversion(conversionId).subscribe(() => {
      this.loadConversions();
    });
  }
}
