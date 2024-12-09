import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Group } from '../../models/group.interface';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { StorageService } from '../../storage.service';

@Component({
  selector: 'app-add-group-dialog',
  imports: [MatCardModule,MatInputModule,ReactiveFormsModule,MatCardModule,MatIconModule,CommonModule,MatSelectModule,MatDatepickerModule],
  templateUrl: './add-group-dialog.component.html',
  styleUrls: ['./add-group-dialog.component.css']
})
export class AddGroupDialogComponent implements OnInit {
  addGroupForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<AddGroupDialogComponent>,
    private fb: FormBuilder,
    private storageService: StorageService
  ) {
    this.addGroupForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      financial_year_start: ['', Validators.required]
    });
  }

  ngOnInit(): void {}

  onSave(): void {
    if (this.addGroupForm.valid) {
      const formValue = this.addGroupForm.value;
      const financialYear = this.formatFinancialYear(formValue.financial_year_start);
      const newGroup: Group = {
        id: 0, // This will be set by the server
        name: formValue.name,
        description: formValue.description,
        financial_year: financialYear,
        user_id: this.storageService.getUser().id
      };
      this.dialogRef.close(newGroup);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  private formatFinancialYear(date: Date): string {
    const year = date.getFullYear();
    return `${year}-${year + 1}`;
  }
}
