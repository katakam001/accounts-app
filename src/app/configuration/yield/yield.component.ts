import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { CommonModule } from '@angular/common';
import { YieldService } from '../../services/yield.service';
import { ConversionService } from '../../services/conversion.service';
import { AddEditYieldDialogComponent } from '../../dialogbox/add-edit-yield-dialog/add-edit-yield-dialog.component';
import { FinancialYearService } from '../../services/financial-year.service';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-yield',
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
    MatListModule,
    MatChipsModule
  ],
  templateUrl: './yield.component.html',
  styleUrls: ['./yield.component.css']
})
export class YieldComponent implements OnInit {
  displayedColumns: string[] = ['rawItem', 'processedItems', 'actions'];
  dataSource: MatTableDataSource<any>;
  yields: any[] = [];
  userId: number;
  financialYear: string;

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private yieldService: YieldService,
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
      this.loadYields();
    }
  }

  loadYields(): void {
    this.yieldService.getYieldsByUserIdAndFinancialYear(this.userId, this.financialYear).subscribe((data: any[]) => {
      this.yields = data;
      this.loadConversions();
    });
  }

  loadConversions(): void {
    this.conversionService.getConversionsByUserIdAndFinancialYear(this.userId, this.financialYear).subscribe((conversions: any[]) => {
      this.yields.forEach(yieldData => {
        this.processConversionsForYield(yieldData, conversions);
      });
      this.dataSource = new MatTableDataSource(this.yields);
      this.dataSource.sort = this.sort;
    });
  }

  processConversionsForYield(yieldData: any, conversions: any[]): void {
    yieldData.processedItems.forEach((item: any) => {
      const conversion = conversions.find((c: any) => c.id === item.conversion_id);
      item.conversion = conversion ? {
        from_unit_name: conversion.from_unit_name,
        to_unit_name: conversion.to_unit_name,
        rate: conversion.rate
      } : null;
    });
  }

  openAddYieldDialog(): void {
    const dialogRef = this.dialog.open(AddEditYieldDialogComponent, {
      width: '800px',
      data: { yield: null, userId: this.userId, financialYear: this.financialYear }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.addYieldToList(result);
      }
    });
  }

  openEditYieldDialog(yieldData: any): void {
    const dialogRef = this.dialog.open(AddEditYieldDialogComponent, {
      width: '800px',
      data: { yield: yieldData, userId: this.userId, financialYear: this.financialYear }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateYield(result);
      }
    });
  }

  addYieldToList(yieldData: any): void {
    this.conversionService.getConversionsByUserIdAndFinancialYear(this.userId, this.financialYear).subscribe((conversions: any[]) => {
      this.processConversionsForYield(yieldData, conversions);
      // Create a *new* array with the added yield
      const newData = [...this.yields, yieldData];
      this.yields = newData; // Update yields array
      this.dataSource.data = this.yields; // Update the dataSource's data property!
    });
  }

  updateYield(yieldData: any): void {
    this.conversionService.getConversionsByUserIdAndFinancialYear(this.userId, this.financialYear).subscribe((conversions: any[]) => {
      this.processConversionsForYield(yieldData, conversions);
      const index = this.yields.findIndex(y => y.rawItem.id === yieldData.rawItem.id);
      if (index !== -1) {
        const newData = [...this.yields];
        newData[index] = yieldData;
        this.yields = newData;
        this.dataSource.data = this.yields; // Update the dataSource's data property!
      }
    });
  }

  deleteYield(yieldId: number): void {
    this.yieldService.deleteYield(yieldId).subscribe(() => {
      // Create a *new* array without the deleted yield
      const newData = this.yields.filter(yieldData => yieldData.rawItem.id !== yieldId);
      this.yields = newData; // Update yields array
      this.dataSource.data = this.yields; // Update the dataSource's data property!
    });
  }
}
