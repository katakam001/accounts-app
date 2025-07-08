import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule, SortDirection } from '@angular/material/sort'; // Import SortDirection
import { CategoryService } from '../../services/category.service';
import { AddEditCategoryDialogComponent } from '../../dialogbox/add-edit-category-dialog/add-edit-category-dialog.component';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { StorageService } from '../../services/storage.service';
import { FinancialYearService } from '../../services/financial-year.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-purchase-categories',
  standalone: true,
  imports: [MatTableModule, MatToolbarModule, MatCardModule, MatIconModule, CommonModule, MatSortModule],
  templateUrl: './purchase-categories.component.html',
  styleUrls: ['./purchase-categories.component.css']
})
export class PurchaseCategoriesComponent implements OnInit, AfterViewInit {
  categories = new MatTableDataSource<any>();
  displayedColumns: string[] = ['name', 'type', 'actions'];
  financialYear: string;

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private categoryService: CategoryService,
    public dialog: MatDialog,
    private storageService: StorageService,
    private financialYearService: FinancialYearService,
    private snackBar: MatSnackBar
  ) {
  }

  ngOnInit(): void {
    this.getFinancialYear();
  }

  ngAfterViewInit() {
    // Assign the MatSort instance to the MatTableDataSource
    this.categories.sort = this.sort;
    // You might also want to trigger an initial sort if desired
    // this.categories.sort.sort({ id: 'name', start: 'asc', disableClear: false });
  }

  getFinancialYear() {
    const storedFinancialYear = this.financialYearService.getStoredFinancialYear();
    if (storedFinancialYear) {
      this.financialYear = storedFinancialYear;
      this.fetchCategories(this.storageService.getUser().id, this.financialYear);
    }
  }

  fetchCategories(userId: number, financialYear: string): void {
    this.categoryService.getCategoriesByUserIdAndFinancialYear(userId, financialYear).subscribe((data: any[]) => {
      this.categories.data = data;
    });
  }

  openAddCategoryDialog(): void {
    const dialogRef = this.dialog.open(AddEditCategoryDialogComponent, {
      width: '400px',
      data: { category: null, userId: this.storageService.getUser().id, financialYear: this.financialYear }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.addCategory(result);
      }
    });
  }

  openEditCategoryDialog(category: any): void {
    const dialogRef = this.dialog.open(AddEditCategoryDialogComponent, {
      width: '400px',
      data: { category, userId: this.storageService.getUser().id, financialYear: this.financialYear }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateCategory(result);
      }
    });
  }

  addCategory(category: any): void {
    this.categoryService.addCategory(category).subscribe((newCategory) => {
      // Create a *new* array with the added category
      const newData = [...this.categories.data, newCategory];
      this.categories.data = newData; // Assign the new array
      // Re-apply sort after data changes
      if (this.categories.sort) {
        const activeSort = this.categories.sort.active || 'name'; // Default to 'name' if no active sort
        const sortDirection: SortDirection = this.categories.sort.direction || 'asc'; // Default to 'asc'

        this.categories.sort.sort({
          id: activeSort,
          start: sortDirection,
          disableClear: false // Crucial: Add disableClear property
        });
      }
      this.snackBar.open(`Category "${newCategory.name}" added successfully.`, 'Close', { duration: 3000 });
    });
  }

  updateCategory(updatedCategory: any): void {
    this.categoryService.updateCategory(updatedCategory.id, updatedCategory).subscribe(() => {
      const index = this.categories.data.findIndex(category => category.id === updatedCategory.id);
      if (index !== -1) {
        // Create a *new* array with the updated category
        const newData = [...this.categories.data]; // Copy existing data
        newData[index] = updatedCategory; // Update the copied array
        this.categories.data = newData; // Assign the new array
        if (this.categories.sort) {
          const activeSort = this.categories.sort.active || 'name'; // Default to 'name' if no active sort
          const sortDirection: SortDirection = this.categories.sort.direction || 'asc'; // Default to 'asc'

          this.categories.sort.sort({
            id: activeSort,
            start: sortDirection,
            disableClear: false // Crucial: Add disableClear property
          });
        }
        this.snackBar.open(`Category "${updatedCategory.name}" updation is successfully.`, 'Close', { duration: 3000 });
      }
    });
  }

  deleteCategory(categoryId: number, name: string): void {
    this.categoryService.deleteCategory(categoryId).subscribe({
      next: () => {
        // Create a *new* array without the deleted category
        const newData = this.categories.data.filter(category => category.id !== categoryId);
        this.categories.data = newData; // Assign the new array
        if (this.categories.sort) {
          const activeSort = this.categories.sort.active || 'name'; // Default to 'name' if no active sort
          const sortDirection: SortDirection = this.categories.sort.direction || 'asc'; // Default to 'asc'

          this.categories.sort.sort({
            id: activeSort,
            start: sortDirection,
            disableClear: false // Crucial: Add disableClear property
          });
        }
        this.snackBar.open(`Category "${name}" deletion is successfully.`, 'Close', { duration: 3000 });
      },
      error: (error) => {
        this.snackBar.open(error.message, 'Close', { duration: 10000 });
      }
    });
  }
}
