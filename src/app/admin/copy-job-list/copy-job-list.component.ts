import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CreateJobService } from '../../services/create-job.service';
import { CreateJobDialogComponent } from '../dialogbox/create-job-dialog/create-job-dialog.component';

@Component({
  selector: 'app-copy-job-list',
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
  ],
  templateUrl: './copy-job-list.component.html',
  styleUrls: ['./copy-job-list.component.css']
})
export class CopyJobListComponent implements OnInit, AfterViewInit {

  displayedColumns: string[] = [
    'sourceUser',
    'targetUser',
    'fromDate',
    'toDate',
    'status',
    'stage',
    'isBackup',
    'actions'
  ];

  dataSource = new MatTableDataSource<any>();
  userId: number;
  financialYear: string;

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private jobService: CreateJobService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,

  ) { }

  ngOnInit(): void {
    this.loadJobs();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  loadJobs(): void {
    this.jobService.getJobsByAdmin().subscribe((data: any[]) => {
      this.dataSource.data = data;
    });
  }

  addJob(): void {
    const dialogRef = this.dialog.open(CreateJobDialogComponent, {
      width: '500px',
      data: { financialYear: this.financialYear }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'refresh') {
        this.loadJobs();
      }
    });
  }

  retryJob(jobId: number): void {
    // Dummy retry method for now
    console.log(`Retrying job ${jobId}...`);
    // Later: this.jobService.retryJob(jobId).subscribe(...)
  }

  // 🔹 New method
  onTriggerLedger(jobId: number) {
    this.jobService.triggerLedgerJob(jobId).subscribe({
      next: () => {
        this.snackBar.open('Ledger job triggered successfully', 'Close', { duration: 3000 });
        this.loadJobs(); // refresh list to show updated status
      },
      error: (err) => {
        const msg = err.error?.error || 'Failed to trigger ledger job';
        this.snackBar.open(msg, 'Close', { duration: 3000 });
      }
    });
  }

  // Map numeric status to labels
  getStatusLabel(status: number): string {
    switch (status) {
      case 0: return 'Pending';
      case 1: return 'Running';
      case 2: return 'Completed';
      case 3: return 'Failed';
      default: return 'Unknown';
    }
  }

  // Map numeric stage to labels
  getStageLabel(stage: number): string {
    switch (stage) {
      case 1: return 'Stage 1a';
      case 2: return 'Stage 1b';
      case 3: return 'Stage 1c';
      case 4: return 'Stage 2a';
      case 5: return 'Stage 2b';
      case 6: return 'Stage 2c';
      case 7: return 'Stage 2d';
      case 8: return 'Finalize';
      default: return 'Unknown';
    }
  }
}
