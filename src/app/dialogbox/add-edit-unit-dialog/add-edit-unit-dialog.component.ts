import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { UnitService } from '../../services/unit.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-add-edit-unit-dialog',
  imports: [MatCardModule, MatInputModule, ReactiveFormsModule, MatCardModule, MatIconModule, CommonModule, MatSelectModule, MatDialogModule, MatDatepickerModule],
  templateUrl: './add-edit-unit-dialog.component.html',
  styleUrls: ['./add-edit-unit-dialog.component.css']
})
export class AddEditUnitDialogComponent implements OnInit {
  unitForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private unitService: UnitService,
    public dialogRef: MatDialogRef<AddEditUnitDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.unitForm = this.fb.group({
      name: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    if (this.data.unit) {
      this.unitForm.patchValue(this.data.unit);
    }
  }

  onSave(): void {
    if (this.unitForm.valid) {
      const unit = this.unitForm.value;
      if (this.data.unit) {
        this.unitService.updateUnit(this.data.unit.id, unit).subscribe(() => {
          this.dialogRef.close(true);
        });
      } else {
        this.unitService.addUnit(unit).subscribe(() => {
          this.dialogRef.close(true);
        });
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
