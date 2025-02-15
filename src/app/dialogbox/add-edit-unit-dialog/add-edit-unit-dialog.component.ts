import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { UnitService } from '../../services/unit.service';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-add-edit-unit-dialog',
  standalone: true,
  imports: [MatInputModule, ReactiveFormsModule, CommonModule, MatDialogModule],
  templateUrl: './add-edit-unit-dialog.component.html',
  styleUrls: ['./add-edit-unit-dialog.component.css']
})
export class AddEditUnitDialogComponent implements OnInit {
  unitForm: FormGroup;
  userId: number;
  financialYear: string;

  constructor(
    private fb: FormBuilder,
    private unitService: UnitService,
    public dialogRef: MatDialogRef<AddEditUnitDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.unitForm = this.fb.group({
      name: ['', Validators.required]
    });
    this.userId = data.userId;
    this.financialYear = data.financialYear;
  }

  ngOnInit(): void {
    if (this.data.unit) {
      this.unitForm.patchValue(this.data.unit);
    }
  }

  onSave(): void {
    if (this.unitForm.valid) {
      const formValue = this.unitForm.value;
      const updatedUnit = {
        id: this.data.unit?.id,
        name: formValue.name,
        user_id: this.userId,
        financial_year: this.financialYear
      };
      this.dialogRef.close(updatedUnit);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
