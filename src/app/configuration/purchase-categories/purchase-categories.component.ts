import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { AddEditCategoryDialogComponent } from '../../dialogbox/add-edit-category-dialog/add-edit-category-dialog.component';
import { CategoryService } from '../../services/category.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-purchase-categories',
  imports: [MatTableModule, MatToolbarModule, MatInputModule, ReactiveFormsModule, MatCardModule, MatSelectModule, MatIconModule, CommonModule],
  templateUrl: './purchase-categories.component.html',
  styleUrls: ['./purchase-categories.component.css']
})
export class PurchaseCategoriesComponent implements OnInit {
  categories: MatTableDataSource<any>;
  displayedColumns: string[] = ['name', 'actions'];

  constructor(private categoryService: CategoryService, public dialog: MatDialog) {
    this.categories = new MatTableDataSource<any>([]);
  }

  ngOnInit(): void {
    this.fetchCategories();
  }

  fetchCategories(): void {
    this.categoryService.getCategories().subscribe((data: any[]) => {
      this.categories.data = data;
    });
  }

  openAddCategoryDialog(): void {
    const dialogRef = this.dialog.open(AddEditCategoryDialogComponent, {
      width: '400px',
      data: { category: null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.fetchCategories();
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
        this.fetchCategories();
      }
    });
  }

  deleteCategory(categoryId: number): void {
    this.categoryService.deleteCategory(categoryId).subscribe(() => {
      this.fetchCategories();
    });
  }
}
