import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CategoryService } from '../../services/category.service';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-add-edit-category-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, MatInputModule, MatSelectModule, MatDialogModule],
  templateUrl: './add-edit-category-dialog.component.html',
  styleUrls: ['./add-edit-category-dialog.component.css']
})
export class AddEditCategoryDialogComponent implements OnInit {
  categoryForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    public dialogRef: MatDialogRef<AddEditCategoryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      type: [null, Validators.required] // Use a number for the type field
    });
  }

  ngOnInit(): void {
    if (this.data.category) {
      this.categoryForm.patchValue(this.data.category);
    }
  }

  onSave(): void {
    if (this.categoryForm.valid) {
      const formValue = this.categoryForm.value;
      const updatedCategory = {
        id: this.data.category?.id,
        name: formValue.name,
        type: formValue.type,
        financial_year: this.data.financialYear,
        user_id: this.data.userId
      };
      this.dialogRef.close(updatedCategory);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
