import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { AreaService } from '../../services/area.service';

@Component({
  selector: 'app-add-edit-area-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './add-edit-area-dialog.component.html',
  styleUrls: ['./add-edit-area-dialog.component.css']
})
export class AddEditAreaDialogComponent implements OnInit {
  areaForm: FormGroup;
  userId: number;
  financialYear: string;

  constructor(
    private fb: FormBuilder,
    private areaService: AreaService,
    public dialogRef: MatDialogRef<AddEditAreaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.areaForm = this.fb.group({
      name: ['', Validators.required]
    });
    this.userId = data.userId;
    this.financialYear = data.financialYear;
  }

  ngOnInit(): void {
    if (this.data.area) {
      this.areaForm.patchValue(this.data.area);
    }
  }

  onSave(): void {
    if (this.areaForm.valid) {
      const formValue = this.areaForm.value;
      const updatedArea = {
        id: this.data.area?.id,
        name: formValue.name,
        user_id: this.userId,
        financial_year: this.financialYear
      };
      this.dialogRef.close(updatedArea);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
