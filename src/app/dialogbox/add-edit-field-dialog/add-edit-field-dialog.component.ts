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
  }

  ngOnInit(): void {
    if (this.data.field) {
      this.fieldForm.patchValue(this.data.field);
    }
  }

  onSave(): void {
    if (this.fieldForm.valid) {
      const field = this.fieldForm.value;
      if (this.data.field) {
        this.fieldService.updateField(this.data.field.id, field).subscribe(() => {
          this.dialogRef.close(true);
          this.snackBar.open('Field updated successfully', 'Close', { duration: 3000 });
        });
      } else {
        this.fieldService.addField(field).subscribe(() => {
          this.dialogRef.close(true);
          this.snackBar.open('Field added successfully', 'Close', { duration: 3000 });
        });
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
