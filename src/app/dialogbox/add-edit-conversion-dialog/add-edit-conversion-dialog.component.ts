import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { ConversionService } from '../../services/conversion.service';
import { UnitService } from '../../services/unit.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-add-edit-conversion-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule
  ],
  templateUrl: './add-edit-conversion-dialog.component.html',
  styleUrls: ['./add-edit-conversion-dialog.component.css']
})
export class AddEditConversionDialogComponent implements OnInit {
  conversionForm: FormGroup;
  userId: number;
  financialYear: string;
  units: any[] = [];

  constructor(
    private fb: FormBuilder,
    private conversionService: ConversionService,
    private unitService: UnitService,
    public dialogRef: MatDialogRef<AddEditConversionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.conversionForm = this.fb.group({
      from_unit_id: ['', Validators.required],
      to_unit_id: ['', Validators.required],
      rate: ['', Validators.required]
    });
    this.userId = data.userId;
    this.financialYear = data.financialYear;
  }

  ngOnInit(): void {
    this.fetchUnits();
    if (this.data.conversion) {
      this.conversionForm.patchValue({
        from_unit_id: this.data.conversion.from_unit_id,
        to_unit_id: this.data.conversion.to_unit_id,
        rate: this.data.conversion.rate
      });
    }
  }

  fetchUnits(): void {
    this.unitService.getUnitsByUserIdAndFinancialYear(this.userId, this.financialYear).subscribe((data: any[]) => {
      this.units = data;
    });
  }

  onSave(): void {
    if (this.conversionForm.valid) {
      const conversionData = {
        ...this.conversionForm.value,
        user_id: this.userId,
        financial_year: this.financialYear
      };
      if (this.data.conversion) {
        this.conversionService.updateConversion(this.data.conversion.id, conversionData).subscribe(() => {
          this.dialogRef.close(true);
        });
      } else {
        this.conversionService.addConversion(conversionData).subscribe(() => {
          this.dialogRef.close(true);
        });
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
