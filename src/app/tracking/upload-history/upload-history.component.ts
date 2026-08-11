import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { UploadService } from '../../services/upload.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FinancialYearService } from '../../services/financial-year.service';
import { StorageService } from '../../services/storage.service';
import { EntryService } from '../../services/entry.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-upload-history',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatCardModule,
    MatTooltipModule
  ],
  templateUrl: './upload-history.component.html',
  styleUrl: './upload-history.component.css'
})
export class UploadHistoryComponent implements OnInit {
  dataSource = new MatTableDataSource<any>();
  financialYear: string;
  fromDate = new FormControl();
  toDate = new FormControl();
  displayedColumns: string[] = [
    'file_name',
    'file_type',
    'total_messages',
    'processed_messages',
    'skipped_messages',
    'status',
    'started_at',
    'completed_at',
    'error_message',
    'action'
  ];
  @ViewChild(MatSort) sort: MatSort;

  constructor(private uploadService: UploadService,
    private financialYearService: FinancialYearService,
    private storageService: StorageService,
    private entryService: EntryService,
    private snackBar: MatSnackBar,
    private datePipe: DatePipe,
  ) { }

  ngOnInit(): void {
    this.getFinancialYear();
  }

  getFinancialYear() {
    const storedFinancialYear = this.financialYearService.getStoredFinancialYear();
    if (storedFinancialYear) {
      this.financialYear = storedFinancialYear;
    }
  }

  loadUploads(): void {
    const fromDateStr = this.datePipe.transform(this.fromDate.value, 'yyyy-MM-dd', 'en-IN') as string; // Transform to desired format
    const toDateStr = this.datePipe.transform(this.toDate.value, 'yyyy-MM-dd', 'en-IN') as string; // Transform to desired format  

    this.uploadService.getUploadHistory(this.storageService.getUser().id, fromDateStr, toDateStr, this.financialYear).subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.dataSource.sort = this.sort;
      },
      error: (err) => console.error('❌ Failed to load upload history:', err)
    });
  }

  onTriggerLedger(uploadId: number) {
    this.entryService.triggerLedgerJob(uploadId).subscribe({
      next: (res: any) => {
        const index = this.dataSource.data.findIndex(upload => upload.id === uploadId);
        const newData = [...this.dataSource.data];
        const updateObj = newData[index];
        updateObj.status = 8;
        newData[index] = updateObj;
        this.dataSource.data = newData;
        this.snackBar.open(res.message, 'Close', {
          duration: 3000,
        });
      },
      error: (err) => {
        this.snackBar.open(err.error?.error || 'Failed to trigger ledger job', 'Close', {
          duration: 3000,
        });
      }
    });
  }

  getStatusLabel(status: number): string {
    switch (status) {
      case 1: return 'Upload Initiated';
      case 2: return 'URL Generated';
      case 3: return 'URL Failed';
      case 4: return 'Upload Failed';
      case 5: return 'Summary Received';
      case 6: return 'Summary Error';
      case 7: return 'Completed';
      case 8: return 'Ledger Job Processed';
      default: return 'Unknown';
    }
  }
}
