import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CategoryUnitService } from '../../services/category-unit.service';
import { AddEditCategoryUnitDialogComponent } from '../../dialogbox/add-edit-category-unit-dialog/add-edit-category-unit-dialog.component';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-category-units',
  imports: [MatTableModule, MatToolbarModule, MatInputModule, ReactiveFormsModule, MatCardModule, MatSelectModule, MatIconModule, CommonModule],
  templateUrl: './category-units.component.html',
  styleUrls: ['./category-units.component.css']
})
export class CategoryUnitsComponent implements OnInit {
  categoryUnits: MatTableDataSource<any>;
  displayedColumns: string[] = ['category_name', 'unit_name', 'actions'];

  constructor(private categoryUnitService: CategoryUnitService, public dialog: MatDialog) {
    this.categoryUnits = new MatTableDataSource<any>([]);
  }

  ngOnInit(): void {
    this.fetchCategoryUnits();
  }

  fetchCategoryUnits(): void {
    this.categoryUnitService.getCategoryUnits().subscribe((data: any[]) => {
      this.categoryUnits.data = data;
    });
  }

  openAddCategoryUnitDialog(): void {
    const dialogRef = this.dialog.open(AddEditCategoryUnitDialogComponent, {
      width: '400px',
      data: { categoryUnit: null }
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
      data: { categoryUnit }
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
