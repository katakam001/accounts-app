import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Account } from '../../models/account.interface';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-edit-account-dialog',
  imports: [MatCardModule,MatInputModule,ReactiveFormsModule,MatCardModule,MatIconModule,CommonModule,MatSelectModule],
  templateUrl: './edit-account-dialog.component.html',
  styleUrls: ['./edit-account-dialog.component.css']
})
export class EditAccountDialogComponent {
  editAccountForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<EditAccountDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Account,
    private fb: FormBuilder
  ) {
    console.log(data);
    this.editAccountForm = this.fb.group({
      id: [data.id],
      name: [data.name, Validators.required],
      description: [data.description],
      balance: [data.balance, Validators.required],
      financial_year: [data.financial_year, Validators.required]
    });
  }

  onSave(): void {
    console.log(this.editAccountForm.value);
    if (this.editAccountForm.valid) {
      this.dialogRef.close(this.editAccountForm.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
