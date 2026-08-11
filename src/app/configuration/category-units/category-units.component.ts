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
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-category-units',
  standalone: true,
  imports: [MatTableModule, MatToolbarModule, MatCardModule, MatSelectModule, MatIconModule, CommonModule, MatSortModule,FormsModule,MatInputModule],
  templateUrl: './category-units.component.html',
  styleUrls: ['./category-units.component.css']
})
export class CategoryUnitsComponent implements OnInit, AfterViewInit {
  categoryUnits = new MatTableDataSource<any>();
  displayedColumns: string[] = ['category_name', 'unit_name', 'actions'];
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

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.categoryUnits.filter = filterValue.trim().toLowerCase();
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
      this.categoryUnits.data = data;
      // ✅ Unified filter logic
      this.categoryUnits.filterPredicate = (categoryUnit, filter) => {
        const normalized = filter.trim().toLowerCase();
        return (
          categoryUnit.category_name?.toLowerCase().includes(normalized) ||
          categoryUnit.unit_name?.toLowerCase().includes(normalized)
        );
      };
    });
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
    this.categoryUnitService.addCategoryUnit(categoryUnit).subscribe({
      next: (response) => {
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
      },
      error: (error) => {
        // Display the error directly from the service response
        this.snackBar.open(error.message, 'Close', { duration: 5000 });
      }
    });
  }

  updateCategoryUnit(categoryUnit: any): void {
    this.categoryUnitService.updateCategoryUnit(categoryUnit.id, categoryUnit).subscribe({
      next: (response) => {
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
      },
      error: (error) => {
        // Display the error directly from the service response
        this.snackBar.open(error.message, 'Close', { duration: 5000 });
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
