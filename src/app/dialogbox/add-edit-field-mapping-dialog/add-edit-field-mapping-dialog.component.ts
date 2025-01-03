import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CategoryService } from '../../services/category.service';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FieldService } from '../../services/field.service'; // Updated import
import { FieldMappingService } from '../../services/field-mapping.service'; // Import FieldMappingService
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar'; // Import MatSnackBar

@Component({
  selector: 'app-add-edit-field-mapping-dialog',
  standalone: true,
  imports: [
    MatInputModule,
    ReactiveFormsModule,
    CommonModule,
    MatSelectModule,
    MatDialogModule,
    MatCheckboxModule
  ],
  templateUrl: './add-edit-field-mapping-dialog.component.html',
  styleUrls: ['./add-edit-field-mapping-dialog.component.css']
})
export class AddEditFieldMappingDialogComponent implements OnInit {
  fieldForm: FormGroup;
  categories: any[] = [];
  fields: any[] = []; // Add fields array
  userId: number;
  financialYear: string;

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private fieldService: FieldService, // Updated service
    private fieldMappingService: FieldMappingService, // Inject FieldMappingService
    private snackBar: MatSnackBar, // Inject MatSnackBar
    public dialogRef: MatDialogRef<AddEditFieldMappingDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.fieldForm = this.fb.group({
      category_id: ['', Validators.required],
      field_id: ['', Validators.required], // Updated to field_id
      field_type: ['', Validators.required],
      field_category: [0, Validators.required], // Default to Normal
      exclude_from_total: [false],
      required: [false],
      type: [1]
    });
    this.userId = data.userId;
    this.financialYear = data.financialYear;
  }

  ngOnInit(): void {
    this.fetchCategories();
    this.fetchFields(); // Fetch fields on initialization
    if (this.data.field) {
      this.fieldForm.patchValue(this.data.field);
      this.setFieldCategoryDisplayValue();
    }
  }

  fetchCategories(): void {
    this.categoryService.getCategoriesByUserIdAndFinancialYear(this.userId, this.financialYear).subscribe((data: any[]) => {
      this.categories = data;
    });
  }

  fetchFields(): void {
    this.fieldService.getAllFieldsByUserIdAndFinancialYear(this.userId, this.financialYear).subscribe((data: any[]) => {
      this.fields = data;
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
      const field = {
        ...this.fieldForm.value,
        user_id: this.userId,
        financial_year: this.financialYear
      };
      if (this.data.field) {
        this.fieldMappingService.updateFieldMapping(this.data.field.id, field).subscribe((response) => {
          this.dialogRef.close(response);
        });
      } else {
        this.fieldMappingService.addFieldMapping(field).subscribe((response) => {
          this.dialogRef.close(response);
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
