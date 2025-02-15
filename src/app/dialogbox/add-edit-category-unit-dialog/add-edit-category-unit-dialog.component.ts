import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CategoryUnitService } from '../../services/category-unit.service';
import { CategoryService } from '../../services/category.service';
import { UnitService } from '../../services/unit.service';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-add-edit-category-unit-dialog',
  standalone: true,
  imports: [MatInputModule, ReactiveFormsModule, CommonModule, MatSelectModule, MatDialogModule],
  templateUrl: './add-edit-category-unit-dialog.component.html',
  styleUrls: ['./add-edit-category-unit-dialog.component.css']
})
export class AddEditCategoryUnitDialogComponent implements OnInit {
  categoryUnitForm: FormGroup;
  categories: any[] = [];
  units: any[] = [];
  userId: number;
  financialYear: string;

  constructor(
    private fb: FormBuilder,
    private categoryUnitService: CategoryUnitService,
    private categoryService: CategoryService,
    private unitService: UnitService,
    public dialogRef: MatDialogRef<AddEditCategoryUnitDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.categoryUnitForm = this.fb.group({
      category_id: ['', Validators.required],
      unit_id: ['', Validators.required]
    });
    this.userId = data.userId;
    this.financialYear = data.financialYear;
  }

  ngOnInit(): void {
    this.fetchCategories();
    this.fetchUnits();
    if (this.data.categoryUnit) {
      this.categoryUnitForm.patchValue(this.data.categoryUnit);
    }
  }

  fetchCategories(): void {
    this.categoryService.getCategoriesByUserIdAndFinancialYear(this.userId, this.financialYear).subscribe((data: any[]) => {
      this.categories = data;
    });
  }

  fetchUnits(): void {
    this.unitService.getUnitsByUserIdAndFinancialYear(this.userId, this.financialYear).subscribe((data: any[]) => {
      this.units = data;
    });
  }

  onSave(): void {
    if (this.categoryUnitForm.valid) {
      const formValue = this.categoryUnitForm.value;
      const updatedCategoryUnit = {
        id: this.data.categoryUnit?.id,
        category_id: formValue.category_id,
        unit_id: formValue.unit_id,
        user_id: this.userId,
        financial_year: this.financialYear
      };
      this.dialogRef.close(updatedCategoryUnit);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
