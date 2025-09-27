import { Component, OnInit } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ExportService } from '../../services/export.service'; // Your service to fetch export data
import { ExportRecord } from '../../models/export.interface';   // Interface for export record
import { FinancialYearService } from '../../services/financial-year.service';
import { StorageService } from '../../services/storage.service';
import { DownloadService } from '../../services/download.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSortModule } from '@angular/material/sort';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-export-history',
  templateUrl: './export-history.component.html',
  styleUrls: ['./export-history.component.css'],
    standalone: true,
  imports: [
    CommonModule,
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
  displayedColumns: string[] = ['file_name','file_type','status','output_key_timestamp','actions'];
  financialYear: string;

  constructor(
    private exportService: ExportService,
    private financialYearService: FinancialYearService,
    private storageService: StorageService,
    private downloadService: DownloadService) { }

  ngOnInit(): void {
    this.getFinancialYear();
  }

  getFinancialYear() {
    const storedFinancialYear = this.financialYearService.getStoredFinancialYear();
    if (storedFinancialYear) {
      this.financialYear = storedFinancialYear;
      this.loadExports();
    }
  }

  loadExports(): void {
    this.exportService.getExportsByUserIdAndFinancialYear(this.storageService.getUser().id, this.financialYear).subscribe((data: ExportRecord[]) => {
      this.dataSource.data = data;
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