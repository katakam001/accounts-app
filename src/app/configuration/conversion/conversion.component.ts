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
        this.addConversionToList(result);
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
        this.updateConversion(result);
      }
    });
  }

  addConversionToList(conversion: any): void {
    this.conversionService.addConversion(conversion).subscribe(response => {
      // Create a *new* array with the added conversion
      const newData = [...this.dataSource.data, response];
      this.dataSource.data = newData; // Assign the new array
      this.dataSource._updateChangeSubscription(); // Refresh the table
    });
  }
  
  updateConversion(conversion: any): void {
    this.conversionService.updateConversion(conversion.id, conversion).subscribe(response => {
      const index = this.dataSource.data.findIndex(c => c.id === response.id);
      if (index !== -1) {
        // Create a *new* array with the updated conversion
        const newData = [...this.dataSource.data]; // Copy existing data
        newData[index] = response; // Update the copied array
        this.dataSource.data = newData; // Assign the new array
        this.dataSource._updateChangeSubscription(); // Refresh the table
      }
    });
  }
  
  deleteConversion(conversionId: number): void {
    this.conversionService.deleteConversion(conversionId).subscribe(() => {
      // Create a *new* array without the deleted conversion
      const newData = this.dataSource.data.filter(conversion => conversion.id !== conversionId);
      this.dataSource.data = newData; // Assign the new array
      this.dataSource._updateChangeSubscription(); // Refresh the table
    });
  }  
}
