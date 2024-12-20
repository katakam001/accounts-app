import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { FieldService } from '../../services/field.service';
import { AddEditFieldDialogComponent } from '../../dialogbox/add-edit-field-dialog/add-edit-field-dialog.component';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-purchase-fields',
  imports: [MatTableModule, MatToolbarModule, MatInputModule, ReactiveFormsModule, MatCardModule, MatSelectModule, MatIconModule, CommonModule, MatSortModule, MatCheckboxModule,FormsModule],
  templateUrl: './purchase-fields.component.html',
  styleUrls: ['./purchase-fields.component.css']
})
export class PurchaseFieldsComponent implements OnInit {
  fields: MatTableDataSource<any>;
  displayedColumns: string[] = ['category_name', 'field_name', 'field_type', 'field_category', 'exclude_from_total', 'required', 'actions'];
  categories: string[] = [];
  fieldTypes: string[] = [];
  fieldCategories: string[] = ['Tax', 'Normal'];
  selectedCategory: string = '';
  selectedFieldType: string = '';
  selectedFieldCategory: string = '';
  excludeFromTotal: boolean = false;
  mandatory: boolean = false;
  originalData: any[] = [];

  @ViewChild(MatSort) sort: MatSort;

  constructor(private fieldService: FieldService, public dialog: MatDialog) {
    this.fields = new MatTableDataSource<any>([]);
  }

  ngOnInit(): void {
    this.fetchFields();
    this.fields.sort = this.sort; // Initialize sorting
  }

  fetchFields(): void {
    this.fieldService.getAllFields().subscribe((data: any[]) => {
      this.originalData = data;
      this.fields.data = data;
      this.fields.sort = this.sort; // Set the sort after fetching the data
      this.extractFilterOptions(data);
    });
  }

  extractFilterOptions(data: any[]): void {
    this.categories = [...new Set(data.map(field => field.category_name))];
    this.fieldTypes = [...new Set(data.map(field => field.field_type))];
  }

  applyFilter(): void {
    let filteredData = this.originalData;

    if (this.selectedCategory) {
      filteredData = filteredData.filter(field => field.category_name === this.selectedCategory);
    }

    if (this.selectedFieldType) {
      filteredData = filteredData.filter(field => field.field_type === this.selectedFieldType);
    }

    if (this.selectedFieldCategory) {
      filteredData = filteredData.filter(field => field.field_category === (this.selectedFieldCategory === 'Tax' ? 1 : 0));
    }

    if (this.excludeFromTotal) {
      filteredData = filteredData.filter(field => field.exclude_from_total);
    }

    if (this.mandatory) {
      filteredData = filteredData.filter(field => field.required);
    }

    this.fields.data = filteredData;
  }

  resetFilters(): void {
    this.selectedCategory = '';
    this.selectedFieldType = '';
    this.selectedFieldCategory = '';
    this.excludeFromTotal = false;
    this.mandatory = false;
    this.fields.data = this.originalData;
  }

  openAddFieldDialog(): void {
    const dialogRef = this.dialog.open(AddEditFieldDialogComponent, {
      width: '400px',
      data: { field: null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.fetchFields();
      }
    });
  }

  openEditFieldDialog(field: any): void {
    const dialogRef = this.dialog.open(AddEditFieldDialogComponent, {
      width: '400px',
      data: { field }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.fetchFields();
      }
    });
  }

  deleteField(fieldId: number): void {
    this.fieldService.deleteField(fieldId).subscribe(() => {
      this.fetchFields();
    });
  }
}
