import { Component, OnInit } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { CreateJobService } from '../../../services/create-job.service';
import { CommonModule, DatePipe } from '@angular/common';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import moment from 'moment';
import { UserFilterPipe } from '../../../pipe/user-filter.pipe';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-create-job-dialog',
  standalone: true,
  imports: [
    MatInputModule,
    ReactiveFormsModule,
    MatIconModule,
    MatDialogModule,
    CommonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatAutocompleteModule,
    MatSlideToggleModule,
    UserFilterPipe
  ],
  templateUrl: './create-job-dialog.component.html',
  styleUrls: ['./create-job-dialog.component.css']
})
export class CreateJobDialogComponent implements OnInit {
  createJobForm: FormGroup;
  users: any[] = [];
  loading = false;

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private jobService: CreateJobService,
    private snackBar: MatSnackBar,
    private datePipe: DatePipe,
    private dialogRef: MatDialogRef<CreateJobDialogComponent>
  ) {
    this.createJobForm = this.fb.group({
      from_date: ['', Validators.required],
      to_date: ['', Validators.required],
      source_user_id: [null, Validators.required],
      source_user_name: ['', Validators.required],
      target_user_id: [null, Validators.required],
      target_user_name: ['', Validators.required],
      is_backup: [false] // default false
    });
  }

  ngOnInit(): void {
    this.adminService.getUsersForAdmin().subscribe(users => {
      this.users = users;
    });
  }

  onSourceUserSelectionChange(user: any): void {
    this.createJobForm.patchValue({
      source_user_id: user.id,
      source_user_name: user.name
    });
  }

  onTargetUserSelectionChange(user: any): void {
    this.createJobForm.patchValue({
      target_user_id: user.id,
      target_user_name: user.name
    });
  }

  createJob(): void {
    if (this.createJobForm.invalid) {
      this.snackBar.open('Please fill all required fields.', 'Close', {
        duration: 3000,
        panelClass: ['snackbar-error']
      });
      return;
    }

    // Transform dates using DatePipe
    const payload = {
      ...this.createJobForm.value,
      from_date: this.datePipe.transform(
        this.createJobForm.get('from_date')?.value,
        'yyyy-MM-dd',
        'en-IN'
      ),
      to_date: this.datePipe.transform(
        this.createJobForm.get('to_date')?.value,
        'yyyy-MM-dd',
        'en-IN'
      ),
      is_backup: this.createJobForm.get('is_backup')?.value // ✅ include flag
    };

    this.loading = true;
    this.jobService.createJob(payload).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.jobId && res.s3Key) {
          this.snackBar.open(`Job ${res.jobId} created successfully.`, 'Close', {
            duration: 3000,
            panelClass: ['snackbar-success']
          });
          this.dialogRef.close('refresh');
        } else if (res.stage1aStatus === 'failed') {
          this.snackBar.open(`Stage1a failed for Job ${res.jobId}: ${res.error}`, 'Close', {
            duration: 4000,
            panelClass: ['snackbar-error']
          });
        }
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(`Error creating job: ${err.error?.message || err.message}`, 'Close', {
          duration: 4000,
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
