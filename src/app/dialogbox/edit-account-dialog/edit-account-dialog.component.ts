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
  imports: [MatCardModule, MatInputModule, ReactiveFormsModule, MatCardModule, MatIconModule, CommonModule, MatSelectModule],
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
      debit_balance: [data.debit_balance, [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      credit_balance: [data.credit_balance, [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      financial_year: [data.financial_year, Validators.required]
    });
  }

  onSave(): void {
    if (this.editAccountForm.valid) {
      const formValue = this.editAccountForm.value;
      const updatedAccount: Account = {
        id: formValue.id,
        name: formValue.name,
        description: formValue.description,
        user_id: this.data.user_id,
        credit_balance: parseFloat(formValue.credit_balance),
        debit_balance: parseFloat(formValue.debit_balance),
        financial_year: formValue.financial_year,
      };
      this.dialogRef.close(updatedAccount);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
