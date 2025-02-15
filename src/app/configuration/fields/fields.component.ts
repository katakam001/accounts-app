import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { FieldService } from '../../services/field.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { AddEditFieldDialogComponent } from '../../dialogbox/add-edit-field-dialog/add-edit-field-dialog.component';
import { FinancialYearService } from '../../services/financial-year.service';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-fields',
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
  ],
  templateUrl: './fields.component.html',
  styleUrls: ['./fields.component.css']
})
export class FieldsComponent implements OnInit {
  displayedColumns: string[] = ['field_name', 'actions'];
  dataSource: MatTableDataSource<any>;
  userId: number;
  financialYear: string;

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private fieldService: FieldService,
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
      this.loadFields();
    }
  }


  loadFields(): void {
    this.fieldService.getAllFieldsByUserIdAndFinancialYear(this.userId, this.financialYear).subscribe((data: any[]) => {
      this.dataSource = new MatTableDataSource(data);
      this.dataSource.sort = this.sort;
    });
  }

  addField(): void {
    const dialogRef = this.dialog.open(AddEditFieldDialogComponent, {
      width: '400px',
      data: { field: null, userId: this.userId, financialYear: this.financialYear }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.addFieldToList(result);
      }
    });
  }

  editField(field: any): void {
    const dialogRef = this.dialog.open(AddEditFieldDialogComponent, {
      width: '400px',
      data: { field, userId: this.userId, financialYear: this.financialYear }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateField(result);
      }
    });
  }

  addFieldToList(field: any): void {
    this.fieldService.addField(field).subscribe(response => {
      console.log(response);

      // Create a *new* array with the added field
      const newData = [...this.dataSource.data, response];  // Spread operator creates a copy
      this.dataSource.data = newData; // Assign the new array
      this.dataSource._updateChangeSubscription(); // Still needed but now works correctly
    });
  }

  updateField(field: any): void {
    this.fieldService.updateField(field.id, field).subscribe(response => {
      const index = this.dataSource.data.findIndex(f => f.id === response.id);
      console.log(response);
      if (index !== -1) {
        // Create a *new* array with the updated field
        const newData = [...this.dataSource.data]; // Copy existing data
        newData[index] = response; // Update the copied array
        this.dataSource.data = newData; // Assign the new array
        this.dataSource._updateChangeSubscription();
      }
    });
  }

  deleteField(fieldId: number): void {
    this.fieldService.deleteField(fieldId).subscribe(() => {
      // Create a *new* array without the deleted field
      const newData = this.dataSource.data.filter(field => field.id !== fieldId);
      this.dataSource.data = newData; // Assign the new array
      this.dataSource._updateChangeSubscription();
    });
  }
}
