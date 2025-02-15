import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FieldService } from '../../services/field.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-add-edit-field-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatCheckboxModule,
    MatSnackBarModule
  ],
  templateUrl: './add-edit-field-dialog.component.html',
  styleUrls: ['./add-edit-field-dialog.component.css']
})
export class AddEditFieldDialogComponent implements OnInit {
  fieldForm: FormGroup;
  userId: number;
  financialYear: string;

  constructor(
    private fb: FormBuilder,
    private fieldService: FieldService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<AddEditFieldDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.fieldForm = this.fb.group({
      field_name: ['', Validators.required]
    });
    this.userId = data.userId;
    this.financialYear = data.financialYear;
  }

  ngOnInit(): void {
    if (this.data.field) {
      this.fieldForm.patchValue(this.data.field);
    }
  }

  onSave(): void {
    if (this.fieldForm.valid) {
      const formValue = this.fieldForm.value;
      const updatedField = {
        id: this.data.field?.id,
        field_name: formValue.field_name,
        user_id: this.userId,
        financial_year: this.financialYear
      };
      this.dialogRef.close(updatedField);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
