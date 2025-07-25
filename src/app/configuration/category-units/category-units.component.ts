import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule, SortDirection } from '@angular/material/sort';
import { CategoryUnitService } from '../../services/category-unit.service';
import { AddEditCategoryUnitDialogComponent } from '../../dialogbox/add-edit-category-unit-dialog/add-edit-category-unit-dialog.component';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FinancialYearService } from '../../services/financial-year.service';
import { StorageService } from '../../services/storage.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-category-units',
  standalone: true,
  imports: [MatTableModule, MatToolbarModule, MatCardModule, MatSelectModule, MatIconModule, CommonModule, MatSortModule],
  templateUrl: './category-units.component.html',
  styleUrls: ['./category-units.component.css']
})
export class CategoryUnitsComponent implements OnInit, AfterViewInit {
  categoryUnits = new MatTableDataSource<any>();
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
    private snackBar: MatSnackBar, // Inject MatSnackBar
    public dialog: MatDialog
  ) {
  }

  ngOnInit(): void {
    this.userId = this.storageService.getUser().id;
    this.getFinancialYear();
  }

  ngAfterViewInit() {
    // Assign the MatSort instance to the MatTableDataSource
    this.categoryUnits.sort = this.sort;
    // You might also want to trigger an initial sort if desired
    // this.categoryUnits.sort.sort({ id: 'category_name', start: 'asc', disableClear: false });
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
        this.addCategoryUnitToList(result);
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
        this.updateCategoryUnit(result);
      }
    });
  }

  addCategoryUnitToList(categoryUnit: any): void {
    this.categoryUnitService.addCategoryUnit(categoryUnit).subscribe(response => {
      // Create a *new* array with the added category unit
      const newData = [...this.categoryUnits.data, response];
      this.categoryUnits.data = newData; // Assign the new array
      // Re-apply sort after data changes
      if (this.categoryUnits.sort) {
        const activeSort = this.categoryUnits.sort.active || 'category_name'; // Default to 'name' if no active sort
        const sortDirection: SortDirection = this.categoryUnits.sort.direction || 'asc'; // Default to 'asc'

        this.categoryUnits.sort.sort({
          id: activeSort,
          start: sortDirection,
          disableClear: false // Crucial: Add disableClear property
        });
      }
      this.snackBar.open(`Category "${response.category_name}" to Unit "${response.unit_name}" relation addition is successfully.`, 'Close', { duration: 3000 });
    });
  }

  updateCategoryUnit(categoryUnit: any): void {
    this.categoryUnitService.updateCategoryUnit(categoryUnit.id, categoryUnit).subscribe(response => {
      const index = this.categoryUnits.data.findIndex(unit => unit.id === response.id);
      if (index !== -1) {
        // Create a *new* array with the updated category unit
        const newData = [...this.categoryUnits.data]; // Copy existing data
        newData[index] = response; // Update the copied array
        this.categoryUnits.data = newData; // Assign the new array
        // Re-apply sort after data changes
        if (this.categoryUnits.sort) {
          const activeSort = this.categoryUnits.sort.active || 'category_name'; // Default to 'name' if no active sort
          const sortDirection: SortDirection = this.categoryUnits.sort.direction || 'asc'; // Default to 'asc'

          this.categoryUnits.sort.sort({
            id: activeSort,
            start: sortDirection,
            disableClear: false // Crucial: Add disableClear property
          });
        }
        this.snackBar.open(`Category "${response.category_name}" to Unit "${response.unit_name}" relation updation is successfully.`, 'Close', { duration: 3000 });
      }
    });
  }

  deleteCategoryUnit(categoryUnitId: number, category_name: string, unit_name: string): void {
    this.categoryUnitService.deleteCategoryUnit(categoryUnitId).subscribe({
      next: () => {
        // Create a *new* array without the deleted category unit
        const newData = this.categoryUnits.data.filter(unit => unit.id !== categoryUnitId);
        this.categoryUnits.data = newData; // Assign the new array
        // Re-apply sort after data changes
        if (this.categoryUnits.sort) {
          const activeSort = this.categoryUnits.sort.active || 'category_name'; // Default to 'name' if no active sort
          const sortDirection: SortDirection = this.categoryUnits.sort.direction || 'asc'; // Default to 'asc'

          this.categoryUnits.sort.sort({
            id: activeSort,
            start: sortDirection,
            disableClear: false // Crucial: Add disableClear property
          });
        }
        this.snackBar.open(`Category "${category_name}" to Unit "${unit_name}" relation deletion is successfully.`, 'Close', { duration: 3000 });
      },
      error: (error) => {
        this.snackBar.open(error.message, 'Close', { duration: 10000 });
      }
    });
  }
}
