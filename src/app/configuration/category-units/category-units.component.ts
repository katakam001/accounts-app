import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { CategoryUnitService } from '../../services/category-unit.service';
import { AddEditCategoryUnitDialogComponent } from '../../dialogbox/add-edit-category-unit-dialog/add-edit-category-unit-dialog.component';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FinancialYearService } from '../../services/financial-year.service';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-category-units',
  standalone: true,
  imports: [MatTableModule, MatToolbarModule, MatCardModule, MatSelectModule, MatIconModule, CommonModule, MatSortModule],
  templateUrl: './category-units.component.html',
  styleUrls: ['./category-units.component.css']
})
export class CategoryUnitsComponent implements OnInit {
  categoryUnits: MatTableDataSource<any>;
  originalData: any[] = [];
  displayedColumns: string[] = ['category_name', 'unit_name', 'actions'];
  categories: string[] = [];
  units: string[] = [];
  selectedCategory: string = '';
  selectedUnit: string = '';
  userId: number;
  financialYear: string;

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private categoryUnitService: CategoryUnitService,
    private financialYearService: FinancialYearService,
    private storageService: StorageService,
    public dialog: MatDialog
  ) {
    this.categoryUnits = new MatTableDataSource<any>([]);
  }

  ngOnInit(): void {
    this.userId = this.storageService.getUser().id;
    this.getFinancialYear();
    this.categoryUnits.sort = this.sort; // Initialize sorting
  }

  getFinancialYear() {
    const storedFinancialYear = this.financialYearService.getStoredFinancialYear();
    if (storedFinancialYear) {
      this.financialYear = storedFinancialYear;
      this.fetchCategoryUnits();
    }
  }


  fetchCategoryUnits(): void {
    this.categoryUnitService.getCategoryUnitsByUserIdAndFinancialYear(this.userId, this.financialYear).subscribe((data: any[]) => {
      this.originalData = data;
      this.categoryUnits.data = data;
      this.categoryUnits.sort = this.sort; // Set the sort after fetching the data
      this.extractFilterOptions(data);
    });
  }

  extractFilterOptions(data: any[]): void {
    this.categories = [...new Set(data.map(unit => unit.category_name))];
    this.units = [...new Set(data.map(unit => unit.unit_name))];
  }

  applyFilter(): void {
    let filteredData = this.originalData;

    if (this.selectedCategory) {
      filteredData = filteredData.filter(unit => unit.category_name === this.selectedCategory);
    }

    if (this.selectedUnit) {
      filteredData = filteredData.filter(unit => unit.unit_name === this.selectedUnit);
    }

    this.categoryUnits.data = filteredData;
  }

  resetFilters(): void {
    this.selectedCategory = '';
    this.selectedUnit = '';
    this.categoryUnits.data = this.originalData;
  }

  openAddCategoryUnitDialog(): void {
    const dialogRef = this.dialog.open(AddEditCategoryUnitDialogComponent, {
      width: '400px',
      data: { categoryUnit: null, userId: this.userId, financialYear: this.financialYear }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.fetchCategoryUnits();
      }
    });
  }

  openEditCategoryUnitDialog(categoryUnit: any): void {
    const dialogRef = this.dialog.open(AddEditCategoryUnitDialogComponent, {
      width: '400px',
      data: { categoryUnit, userId: this.userId, financialYear: this.financialYear }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.fetchCategoryUnits();
      }
    });
  }

  deleteCategoryUnit(categoryUnitId: number): void {
    this.categoryUnitService.deleteCategoryUnit(categoryUnitId).subscribe(() => {
      this.fetchCategoryUnits();
    });
  }
}
