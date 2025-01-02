import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FieldMappingService } from '../../services/field-mapping.service';
import { AddEditFieldMappingDialogComponent } from '../../dialogbox/add-edit-field-mapping-dialog/add-edit-field-mapping-dialog.component';
import { FinancialYearService } from '../../services/financial-year.service';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-purchase-fields',
  standalone: true,
  imports: [
    MatTableModule,
    MatToolbarModule,
    MatCardModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatIconModule,
    FormsModule,
    CommonModule,
    MatSortModule
  ],
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
  userId: number;
  financialYear: string;

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private fieldMappingService: FieldMappingService,
    private financialYearService: FinancialYearService,
    private storageService: StorageService,
    public dialog: MatDialog
  ) {
    this.fields = new MatTableDataSource<any>([]);
  }

  ngOnInit(): void {
    this.userId = this.storageService.getUser().id;
    this.getFinancialYear();
    this.fields.sort = this.sort; // Initialize sorting
  }

  getFinancialYear() {
    const storedFinancialYear = this.financialYearService.getStoredFinancialYear();
    if (storedFinancialYear) {
      this.financialYear = storedFinancialYear;
      this.fetchFields();
    }
  }


  fetchFields(): void {
    this.fieldMappingService.getFieldMappingsByUserIdAndFinancialYear(this.userId, this.financialYear).subscribe((data: any[]) => {
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
    const dialogRef = this.dialog.open(AddEditFieldMappingDialogComponent, {
      width: '400px',
      data: { field: null, userId: this.userId, financialYear: this.financialYear }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.fetchFields();
      }
    });
  }

  openEditFieldDialog(field: any): void {
    const dialogRef = this.dialog.open(AddEditFieldMappingDialogComponent, {
      width: '400px',
      data: { field, userId: this.userId, financialYear: this.financialYear }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.fetchFields();
      }
    });
  }

  deleteField(fieldId: number): void {
    this.fieldMappingService.deleteFieldMapping(fieldId).subscribe(() => {
      this.fetchFields();
    });
  }
}
