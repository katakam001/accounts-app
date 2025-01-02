import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { CategoryService } from '../../services/category.service';
import { AddEditCategoryDialogComponent } from '../../dialogbox/add-edit-category-dialog/add-edit-category-dialog.component';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { StorageService } from '../../services/storage.service';
import { FinancialYearService } from '../../services/financial-year.service';

@Component({
  selector: 'app-purchase-categories',
  standalone: true,
  imports: [MatTableModule, MatToolbarModule, MatCardModule, MatIconModule, CommonModule, MatSortModule],
  templateUrl: './purchase-categories.component.html',
  styleUrls: ['./purchase-categories.component.css']
})
export class PurchaseCategoriesComponent implements OnInit {
  categories: MatTableDataSource<any>;
  displayedColumns: string[] = ['name', 'type', 'actions'];
  financialYear: string;

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private categoryService: CategoryService,
    public dialog: MatDialog,
    private storageService: StorageService,
    private financialYearService: FinancialYearService
  ) {
    this.categories = new MatTableDataSource<any>([]);
  }

  ngOnInit(): void {
    this.getFinancialYear();
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
      this.categories.sort = this.sort; // Set the sort after fetching the data
    });
  }

  openAddCategoryDialog(): void {
    const dialogRef = this.dialog.open(AddEditCategoryDialogComponent, {
      width: '400px',
      data: { category: null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.fetchCategories(this.storageService.getUser().id, this.financialYear);
      }
    });
  }

  openEditCategoryDialog(category: any): void {
    const dialogRef = this.dialog.open(AddEditCategoryDialogComponent, {
      width: '400px',
      data: { category }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.fetchCategories(this.storageService.getUser().id, this.financialYear);
      }
    });
  }

  deleteCategory(categoryId: number): void {
    this.categoryService.deleteCategory(categoryId).subscribe(() => {
      this.fetchCategories(this.storageService.getUser().id, this.financialYear);
    });
  }
}
