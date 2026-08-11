import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ExportService } from '../../services/export.service'; // Your service to fetch export data
import { ExportRecord } from '../../models/export.interface';   // Interface for export record
import { FinancialYearService } from '../../services/financial-year.service';
import { StorageService } from '../../services/storage.service';
import { DownloadService } from '../../services/download.service';
import { CommonModule, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-export-history',
  templateUrl: './export-history.component.html',
  styleUrls: ['./export-history.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatSortModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatCardModule
  ]
})
export class ExportHistoryComponent implements OnInit {
  dataSource = new MatTableDataSource<ExportRecord>();
  displayedColumns: string[] = ['file_name', 'file_type', 'status', 'output_key_timestamp', 'actions'];
  financialYear: string;
  fromDate = new FormControl();
  toDate = new FormControl();
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private exportService: ExportService,
    private financialYearService: FinancialYearService,
    private storageService: StorageService,
    private downloadService: DownloadService,
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

  loadExports(): void {
    const fromDateStr = this.datePipe.transform(this.fromDate.value, 'yyyy-MM-dd', 'en-IN') as string; // Transform to desired format
    const toDateStr = this.datePipe.transform(this.toDate.value, 'yyyy-MM-dd', 'en-IN') as string; // Transform to desired format  

    this.exportService.getExportsByUserIdAndFinancialYear(this.storageService.getUser().id, fromDateStr, toDateStr, this.financialYear).subscribe((data: ExportRecord[]) => {
      this.dataSource.data = data;
      this.dataSource.sort = this.sort;
    });
  }

  getStatusLabel(status: number): string {
    switch (status) {
      case 0: return 'Pending';
      case 1: return 'Processing';
      case 2: return 'Completed';
      case 3: return 'Failed';
      default: return 'Unknown';
    }
  }

  downloadExport(record: ExportRecord): void {
    if (record.status === 2 && record.output_key) {
      this.downloadService.getPresignedUrl(record.output_key).subscribe(
        (response) => {
          const presignedUrl = response?.presignedUrl; // Safe check
          const a = document.createElement('a');
          a.href = presignedUrl;
          a.download = record.file_name || 'export.csv';
          a.click();
        },
        (error) => {
          console.error('Error fetching presigned URL:', error);
        }
      );
    }
  }
}