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
  financialYearStatus: string | null = null;
  financialYearError: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<FinancialYearDialogComponent>,
    private financialYearService: FinancialYearService,
    private storageService: StorageService
  ) {}

  onSave() {
    const selectedDate = this.dateControl.value;
    if (selectedDate) {
      const financialYear = this.generateFinancialYear(selectedDate.toDate());
      const userId = this.storageService.getUser().id;

      // Call backend and capture status + error
      this.financialYearService.setFinancialYear(financialYear, userId).subscribe(res => {
        this.financialYearStatus = this.mapStatus(res.status);
        this.financialYearError = res.error_message;
        this.dialogRef.close({ 
          financialYear, 
          status: this.financialYearStatus, 
          error: this.financialYearError 
        });
      });
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

  mapStatus(status: number): string {
    switch (status) {
      case 1: return 'Seeded';
      case 2: return 'Processing';
      case 3: return 'Ready';
      case 4: return 'Failed';
      default: return 'Unknown';
    }
  }
}
