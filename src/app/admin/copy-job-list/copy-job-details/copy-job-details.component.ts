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
  selector: 'app-copy-job-details',
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
  templateUrl: './copy-job-details.component.html',
  styleUrls: ['./copy-job-details.component.css']
})
export class CopyJobDetailsComponent implements OnInit {
  jobId!: number;
  groupedTables: { stage: number, tables: any[] }[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private jobService: CreateJobService
  ) { }

  ngOnInit(): void {
    this.jobId = +this.route.snapshot.paramMap.get('jobId')!;
    this.jobService.getJobTables(this.jobId).subscribe(data => {
      this.groupedTables = this.transformTables(data);
    });
  }

  transformTables(data: any[]): { stage: number, tables: any[] }[] {
    const stageGroups: { [key: number]: any[] } = {};

    data.forEach(t => {
      let alias = t.table_name;

      // Stage 1 aliases
      if (t.stage === 1) {
        if (t.table_name === 'group_list') alias = 'Groups';
        else if (t.table_name === 'categories') alias = 'Categories';
        else if (t.table_name === 'items') alias = 'Items';
        else if (t.table_name === 'units') alias = 'Units';
        else if (t.table_name === 'fields') alias = 'Fields';
        else if (t.table_name === 'areas') alias = 'Areas';
        else if (t.table_name === 'brokers') alias = 'Brokers';
      }

      // Stage 2
      if (t.stage === 2) {
        if (t.table_name === 'account_list') alias = 'Accounts';
        else if (t.table_name === 'category_units') alias = 'Category Units';
        else if (t.table_name === 'conversions') alias = 'Conversions';
        else if (t.table_name === 'opening_stock') alias = 'Opening Stock';
        else return; // mask addresses + account_group
      }

      // Stage 3
      if (t.stage === 3) {
        if (t.table_name === 'raw_items') alias = 'Yields';
        else if (t.table_name === 'fields_mapping') alias = 'Field Mapping';
        else return; // mask processed_items
      }

      // Stage 4
      if (t.stage === 4) {
        if (t.table_name === 'journal_entries') alias = 'Journal Entries';
        else return; // mask journal_items
      }

      // Stage 5
      if (t.stage === 5) {
        if (t.table_name === 'journal_entries') alias = 'Invoices';
        else return; // mask journal_items, entries, entry_fields
      }

      // Stage 6
      if (t.stage === 6) {
        if (['cash_entries', 'cash_entries_batch'].includes(t.table_name)) alias = 'Cash Entries';
        else if (t.table_name === 'production_entries') alias = 'Production Entries';
        else return;
      }

      // Stage 7
      if (t.stage === 7) {
        if (t.table_name === 'cash_sale_entries') alias = 'Cash Sales';
        else return; // mask cash_entry_fields
      }

      if (!stageGroups[t.stage]) stageGroups[t.stage] = [];
      const existing = stageGroups[t.stage].find(g => g.alias === alias);

      if (existing) {
        existing.total += t.total_count;
        existing.processed += t.processed_count;
        existing.inserted += t.inserted_count;
        existing.skipped += t.skipped_count;
        existing.deleted += t.deleted_count;
      } else {
        stageGroups[t.stage].push({
          id: t.id,               // ✅ keep table id for navigation
          alias,
          total: t.total_count,
          processed: t.processed_count,
          inserted: t.inserted_count,
          skipped: t.skipped_count,
          deleted: t.deleted_count
        });
      }
    });

    return Object.keys(stageGroups).map(stage => ({
      stage: +stage,
      tables: stageGroups[+stage]
    }));
  }

  viewChunks(tableId: number): void {
    this.router.navigate(['/copyJobs', this.jobId, 'tables', tableId, 'chunks']);
  }

  goBack(): void {
    this.router.navigate(['/copyJob-list']);
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

  getStageClass(stage: number): string {
    if (stage >= 1 && stage <= 3) {
      return 'stage-early';
    } else if (stage >= 4 && stage <= 8) {
      return 'stage-late';
    }
    return '';
  }
}
