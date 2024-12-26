import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CategoryService } from '../../services/category.service';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FieldService } from '../../services/field.service';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar'; // Import MatSnackBar

@Component({
  selector: 'app-add-edit-field-dialog',
  standalone: true,
  imports: [ MatInputModule, ReactiveFormsModule,CommonModule, MatSelectModule, MatDialogModule, MatCheckboxModule],
  templateUrl: './add-edit-field-dialog.component.html',
  styleUrls: ['./add-edit-field-dialog.component.css']
})
export class AddEditFieldDialogComponent implements OnInit {
  fieldForm: FormGroup;
  categories: any[] = [];

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private fieldService: FieldService,
    private snackBar: MatSnackBar, // Inject MatSnackBar
    public dialogRef: MatDialogRef<AddEditFieldDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.fieldForm = this.fb.group({
      category_id: ['', Validators.required],
      field_name: ['', Validators.required],
      field_type: ['', Validators.required],
      field_category: [0, Validators.required], // Default to Normal
      exclude_from_total: [false],
      required: [false],
      type: [1]
    });
  }

  ngOnInit(): void {
    this.fetchCategories();
    if (this.data.field) {
      this.fieldForm.patchValue(this.data.field);
      this.setFieldCategoryDisplayValue();
    }
  }

  fetchCategories(): void {
    this.categoryService.getCategories().subscribe((data: any[]) => {
      this.categories = data;
    });
  }

  setFieldCategoryDisplayValue(): void {
    const fieldCategory = this.fieldForm.get('field_category')?.value;
    if (fieldCategory === 0) {
      this.fieldForm.get('field_category')?.setValue(0); // Normal
    } else if (fieldCategory === 1) {
      this.fieldForm.get('field_category')?.setValue(1); // Tax
    }
  }

  onSave(): void {
    if (this.fieldForm.valid) {
      const field = this.fieldForm.value;
      if (this.data.field) {
        this.fieldService.updateField(this.data.field.id, field).subscribe(() => {
          this.dialogRef.close(true);
        });
      } else {
        this.fieldService.addField(field).subscribe(() => {
          this.dialogRef.close(true);
        });
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onExcludeFromTotalChange(): void {
    if (this.fieldForm.get('exclude_from_total')?.value && this.fieldForm.get('field_category')?.value !== 1) {
      this.snackBar.open('Only tax fields can be excluded from the total amount.', 'Close', {
        duration: 3000,
      });
      this.fieldForm.get('exclude_from_total')?.setValue(false);
    }
  }
}
