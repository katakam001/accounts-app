import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CreateJobService } from '../../../services/create-job.service';
import { CommonModule } from '@angular/common';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-copy-job-chunks',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatCardModule
  ],
  templateUrl: './copy-job-chunks.component.html',
  styleUrls: ['./copy-job-chunks.component.css']
})
export class CopyJobChunksComponent implements OnInit {
  tableId!: number;
  chunks: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private jobService: CreateJobService,
    private router: Router,

  ) { }

  ngOnInit(): void {
    this.tableId = +this.route.snapshot.paramMap.get('tableId')!;
    this.jobService.getJobChunks(this.tableId).subscribe(data => {
      this.chunks = data;
    });
  }

  goBack(): void {
    const jobId = +this.route.snapshot.paramMap.get('jobId')!;
    this.router.navigate(['/copyJobs', jobId, 'details']);
  }


  getStatusLabel(status: number): string {
    switch (status) {
      case 0: return 'Pending';
      case 1: return 'Running';
      case 2: return 'Completed';
      case 3: return 'Failed';
      default: return 'Unknown';
    }
  }
}
