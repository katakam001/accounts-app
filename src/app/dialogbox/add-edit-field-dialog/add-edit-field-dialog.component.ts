import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CategoryService } from '../../services/category.service';
import { FieldService } from '../../services/field.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-add-edit-field-dialog',
  imports: [MatCardModule, MatInputModule, ReactiveFormsModule, MatCardModule, MatIconModule, CommonModule, MatSelectModule, MatDialogModule, MatDatepickerModule],
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
    public dialogRef: MatDialogRef<AddEditFieldDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.fieldForm = this.fb.group({
      category_id: ['', Validators.required],
      field_name: ['', Validators.required],
      field_type: ['', Validators.required],
      required: [false]
    });
  }

  ngOnInit(): void {
    this.fetchCategories();
    if (this.data.field) {
      this.fieldForm.patchValue(this.data.field);
    }
  }

  fetchCategories(): void {
    this.categoryService.getCategories().subscribe((data: any[]) => {
      this.categories = data;
    });
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
}
