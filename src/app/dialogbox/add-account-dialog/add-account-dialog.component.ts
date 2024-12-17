import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Account } from '../../models/account.interface';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { StorageService } from '../../services/storage.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { GroupService } from '../../services/group.service';
import { Group } from '../../models/group.interface';

@Component({
  selector: 'app-add-account-dialog',
  imports: [MatCardModule, MatInputModule, ReactiveFormsModule, MatCardModule, MatIconModule, CommonModule, MatSelectModule, MatDatepickerModule],
  templateUrl: './add-account-dialog.component.html',
  styleUrls: ['./add-account-dialog.component.css']
})
export class AddAccountDialogComponent implements OnInit {
  addAccountForm: FormGroup;
  groups: Group[] = [];

  constructor(
    public dialogRef: MatDialogRef<AddAccountDialogComponent>,
    private fb: FormBuilder,
    private storageService: StorageService,
    private groupService: GroupService,
        @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.addAccountForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      debit_balance: [0, [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      credit_balance: [0, [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      financial_year_start: ['', Validators.required],
      groups: [[], Validators.required] // New form control for groups
    });
  }

  ngOnInit(): void {
    this.fetchGroups();
  }

  fetchGroups(): void {
    this.groupService.getGroupsByUserIdAndFinancialYear(this.storageService.getUser().id,this.data.financialYear).subscribe((data: Group[]) => {
      this.groups = data;
    });
  }

  onSave(): void {
    if (this.addAccountForm.valid) {
      const formValue = this.addAccountForm.value;
      const newAccount: Account = {
        id: 0, // This will be set by the server
        name: formValue.name,
        description: formValue.description,
        user_id: this.storageService.getUser().id,
        credit_balance: parseFloat(formValue.credit_balance),
        debit_balance: parseFloat(formValue.debit_balance),
        financial_year: this.data.financialYear,
        groups: formValue.groups // Include selected groups
      };
      this.dialogRef.close(newAccount);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
