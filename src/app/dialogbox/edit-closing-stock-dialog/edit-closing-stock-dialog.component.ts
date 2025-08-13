import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-edit-closing-stock-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './edit-closing-stock-dialog.component.html',
  styleUrls: ['./edit-closing-stock-dialog.component.css']
})
export class EditClosingStockDialogComponent implements OnInit {
  stockForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<EditClosingStockDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.stockForm = this.fb.group({
      value: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    if (this.data.stock) {
      this.stockForm.patchValue({ value: this.data.stock.value });
    }
  }

  onSave(): void {
    if (this.stockForm.valid) {
      const updatedStock = {
        id: this.data.stock.id,
        value: this.stockForm.value.value,
        is_manual: true
      };
      this.dialogRef.close(updatedStock);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
