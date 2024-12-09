import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
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
  selector: 'app-edit-group-dialog',
  imports: [MatCardModule,MatInputModule,ReactiveFormsModule,MatCardModule,MatIconModule,CommonModule,MatSelectModule,MatDatepickerModule],
  templateUrl: './edit-group-dialog.component.html',
  styleUrls: ['./edit-group-dialog.component.css']
})
export class EditGroupDialogComponent implements OnInit {
  editGroupForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<EditGroupDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Group,
    private fb: FormBuilder,
    private storageService: StorageService
  ) {
    this.editGroupForm = this.fb.group({
      id: [data.id],
      name: [data.name, Validators.required],
      description: [data.description],
      financial_year_start: [data.financial_year, Validators.required]
    });
  }

  ngOnInit(): void {}

  onSave(): void {
    if (this.editGroupForm.valid) {
      const formValue = this.editGroupForm.value;
      const financialYear = this.formatFinancialYear(formValue.financial_year_start);
      const updatedGroup: Group = {
        id: formValue.id,
        name: formValue.name,
        description: formValue.description,
        financial_year: financialYear,
        user_id: this.storageService.getUser().id
      };
      this.dialogRef.close(updatedGroup);
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
