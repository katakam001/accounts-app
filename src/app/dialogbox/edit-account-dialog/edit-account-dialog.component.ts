import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Account } from '../../models/account.interface';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { GroupService } from '../../services/group.service';
import { Group } from '../../models/group.interface';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { GroupFilterPipe } from '../../pipe/group-filter.pipe';

@Component({
  selector: 'app-edit-account-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, MatSelectModule, MatCheckboxModule, MatInputModule,MatAutocompleteModule,GroupFilterPipe],
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
      gst_no: [data.account.gst_no],
      debit_balance: [data.account.debit_balance, [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      credit_balance: [data.account.credit_balance, [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      financial_year: [data.account.financial_year, Validators.required],
      group: [data.account.group?.id || null, Validators.required], // Updated form control for group
      group_name: [data.account.group?.name || null, Validators.required], // Updated form control for group
      isDealer: [data.account.isDealer || false], // New form control for isDealer
      address: this.fb.group({ // New form group for address
        street: [data.account.address?.street || ''],
        city: [data.account.address?.city || ''],
        state: [data.account.address?.state || ''],
        postal_code: [data.account.address?.postal_code || ''],
        country: [data.account.address?.country || '']
      })
    });
  }
  onGroupSelectionChange(event: any): void {
    this.editAccountForm.patchValue({
      group: event.id,
      group_name:event.name
    });
  }
  ngOnInit(): void {
    this.fetchGroups();
  }

  fetchGroups(): void {
    this.groupService.getGroupsByUserIdAndFinancialYear(this.data.userId, this.data.financialYear).subscribe((data: Group[]) => {
      this.groups = data;
    });
  }

  onSave(): void {
    if (this.editAccountForm.valid) {
      const formValue = this.editAccountForm.value;
      const updatedAccount: Account = {
        id: formValue.id,
        name: formValue.name,
        gst_no: formValue.gst_no,
        user_id: this.data.userId,
        credit_balance: parseFloat(formValue.credit_balance),
        debit_balance: parseFloat(formValue.debit_balance),
        financial_year: this.data.financialYear,
        group: formValue.group, // Include selected group
        isDealer: formValue.isDealer, // Include isDealer
        address: formValue.address.street || formValue.address.city || formValue.address.state || formValue.address.postal_code || formValue.address.country ? formValue.address : null // Include address if any field is filled
      };
      this.dialogRef.close(updatedAccount);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
