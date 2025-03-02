import { Component } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FinancialYearService } from '../../services/financial-year.service';
import { StorageService } from '../../services/storage.service';
import { CommonModule } from '@angular/common';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-financial-year-dialog',
  standalone: true,
  imports: [MatInputModule, ReactiveFormsModule, CommonModule, MatDialogModule, MatDatepickerModule],
  templateUrl: './financial-year-dialog.component.html',
  styleUrls: ['./financial-year-dialog.component.css']
})
export class FinancialYearDialogComponent {
  dateControl = new FormControl();

  constructor(
    public dialogRef: MatDialogRef<FinancialYearDialogComponent>,
    private financialYearService: FinancialYearService,
    private storageService: StorageService
  ) {}

  onSave() {
    const selectedDate = this.dateControl.value;
    if (selectedDate) {
      const financialYear = this.generateFinancialYear(selectedDate);
      const userId = this.storageService.getUser().id;
      this.financialYearService.setFinancialYear(financialYear, userId);
      this.dialogRef.close();
    }
  }

  generateFinancialYear(date: Date): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // getMonth() returns 0-based month
    if (month >= 4) {
      return `${year}-${year + 1}`;
    } else {
      return `${year - 1}-${year}`;
    }
  }
}
