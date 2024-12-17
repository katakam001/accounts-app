import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Account} from '../../models/account.interface';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { GroupService } from '../../services/group.service';
import { Group } from '../../models/group.interface';

@Component({
  selector: 'app-edit-account-dialog',
  imports: [MatCardModule, MatInputModule, ReactiveFormsModule, MatCardModule, MatIconModule, CommonModule, MatSelectModule],
  templateUrl: './edit-account-dialog.component.html',
  styleUrls: ['./edit-account-dialog.component.css']
})
export class EditAccountDialogComponent implements OnInit {
  editAccountForm: FormGroup;
  groups: Group[] = [];

  constructor(
    public dialogRef: MatDialogRef<EditAccountDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private groupService: GroupService
  ) {
    this.editAccountForm = this.fb.group({
      id: [data.account.id],
      name: [data.account.name, Validators.required],
      description: [data.account.description],
      debit_balance: [data.account.debit_balance, [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      credit_balance: [data.account.credit_balance, [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      financial_year: [data.account.financial_year, Validators.required],
      groups: [data.account.groups || [], Validators.required] // New form control for groups
    });
  }

  ngOnInit(): void {
    this.fetchGroups();
  }

  fetchGroups(): void {
    this.groupService.getGroupsByUserIdAndFinancialYear(this.data.userId,this.data.financialYear).subscribe((data: Group[]) => {
      this.groups = data;
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
        groups: formValue.groups // Include selected groups
      };
      this.dialogRef.close(updatedAccount);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
