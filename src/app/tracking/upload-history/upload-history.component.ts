import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { UploadService } from '../../services/upload.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FinancialYearService } from '../../services/financial-year.service';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-upload-history',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatDialogModule,
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
  displayedColumns: string[] = [
    'file_name',
    'file_type',
    'total_messages',
    'processed_messages',
    'skipped_messages',
    'status',
    'started_at',
    'completed_at',
    'error_message'
  ];

  constructor(private uploadService: UploadService,
    private financialYearService: FinancialYearService,
    private storageService: StorageService
  ) { }

  ngOnInit(): void {
    this.getFinancialYear();
  }

  getFinancialYear() {
    const storedFinancialYear = this.financialYearService.getStoredFinancialYear();
    if (storedFinancialYear) {
      this.financialYear = storedFinancialYear;
      this.loadUploads();
    }
  }

  loadUploads(): void {
    this.uploadService.getUploadHistory(this.storageService.getUser().id, this.financialYear).subscribe({
      next: (data) => this.dataSource.data = data,
      error: (err) => console.error('❌ Failed to load upload history:', err)
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
      default: return 'Unknown';
    }
  }
}
