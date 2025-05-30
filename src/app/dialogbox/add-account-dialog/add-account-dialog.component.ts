import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Account } from '../../models/account.interface';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { StorageService } from '../../services/storage.service';
import { GroupService } from '../../services/group.service';
import { Group } from '../../models/group.interface';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { GroupFilterPipe } from '../../pipe/group-filter.pipe';

@Component({
  selector: 'app-add-account-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, MatSelectModule, MatCheckboxModule, MatInputModule,MatAutocompleteModule,GroupFilterPipe],
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
      gst_no: [''],
      debit_balance: [0, [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      credit_balance: [0, [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      group: [null, Validators.required], // Updated form control for group
      group_name: [null, Validators.required],
      isDealer: [false], // New form control for isDealer
      address: this.fb.group({ // New form group for address
        street: [''],
        city: [''],
        state: [''],
        postal_code: [''],
        country: ['']
      })
    });
  }

  ngOnInit(): void {
    this.fetchGroups();
  }

  onGroupSelectionChange(event: any): void {
    this.addAccountForm.patchValue({
      group: event.id,
      group_name:event.name
    });
}

  fetchGroups(): void {
    this.groupService.getGroupsByUserIdAndFinancialYear(this.storageService.getUser().id, this.data.financialYear).subscribe((data: Group[]) => {
      this.groups = data;
    });
  }

  onSave(): void {
    if (this.addAccountForm.valid) {
      const formValue = this.addAccountForm.value;
      const newAccount: Account = {
        id: 0, // This will be set by the server
        name: formValue.name,
        gst_no: formValue.gst_no,
        user_id: this.storageService.getUser().id,
        credit_balance: parseFloat(formValue.credit_balance),
        debit_balance: parseFloat(formValue.debit_balance),
        financial_year: this.data.financialYear,
        group: formValue.group, // Include selected group
        isDealer: formValue.isDealer, // Include isDealer
        address: formValue.address.street || formValue.address.city || formValue.address.state || formValue.address.postal_code || formValue.address.country ? formValue.address : null // Include address if any field is filled
      };
      this.dialogRef.close(newAccount);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
