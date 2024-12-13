import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { AccountService } from '../../services/account.service';
import { StorageService } from '../../services/storage.service';
import { Account } from '../../models/account.interface';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-cash-book-dialog',
  imports: [MatCardModule, MatInputModule, ReactiveFormsModule, MatCardModule, MatIconModule, CommonModule, MatSelectModule, MatDialogModule, MatDatepickerModule],
  templateUrl: './add-cash-book-dialog.component.html',
  styleUrls: ['./add-cash-book-dialog.component.css']
})
export class AddCashBookDialogComponent implements OnInit {
  cashBookForm: FormGroup;
  accountList: { id: number, account_name: string }[] = [];
  narrations = ['CASH-PAID', 'CASH DEPOSIT', 'CASH RECEIVED', 'TRANSFER', 'CUSTOM'];
  isCustomNarration = false;
  runningBalance: number;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddCashBookDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private accountService: AccountService,
    private storageService: StorageService
  ) {}

  ngOnInit(): void {
    this.runningBalance= this.data.currentBalance;
    this.cashBookForm = this.fb.group({
      cash_entry_date: [null, Validators.required],
      account_name: [null, Validators.required],
      narration: [null, Validators.required],
      narration_description: [{ value: '', disabled: true }, Validators.required],
      cash_debit: [0, Validators.required],
      cash_credit: [0, Validators.required],
      amount: [0, Validators.required],
      account_id: [0, Validators.required],
      type: [false, Validators.required]
    });
    this.fetchAccountList();
  }
  fetchAccountList(): void {
    this.accountService.getAccountsByUserIdAndFinancialYear(this.storageService.getUser().id,this.data.financialYear).subscribe((accounts: Account[]) => {
      this.accountList = accounts.map(account => ({
        id: account.id,
        account_name: account.name
      }));
    });
  }

  dateFilter = (date: Date | null): boolean => {
    if (!date || !this.data.financialYear) {
      return false;
    }

    const [startYear, endYear] = this.data.financialYear.split('-').map(Number);
    const startDate = new Date(startYear, 3, 1); // April 1st of start year
    const endDate = new Date(endYear, 2, 31); // March 31st of end year
    return date >= startDate && date <= endDate;
  };

  onAccountSelectionChange(event: any): void {
    console.log(event.value);
    const selectedAccount = event.value;
    const selectedAccountId = this.accountList.find(account => account.account_name === selectedAccount);
    if (selectedAccountId) {
      this.cashBookForm.patchValue({
        account_id: selectedAccountId.id,
      });
    }
  }

  onNarrationChange(value: string): void {
    this.isCustomNarration = value === 'CUSTOM';
    if (this.isCustomNarration) {
      this.cashBookForm.controls['narration_description'].enable();
    } else {
      this.cashBookForm.controls['narration_description'].disable();
      this.cashBookForm.patchValue({
        narration_description: value,
      });
      console.log(this.cashBookForm);
    }
  }

  updateRunningBalance(): void {
    const cashDebit = parseFloat(this.cashBookForm.value.cash_debit) || 0;
    const cashCredit = parseFloat(this.cashBookForm.value.cash_credit) || 0;
    this.runningBalance = this.data.currentBalance - cashDebit + cashCredit;
  }

  onSave(): void {
    this.cashBookForm.controls['narration_description'].enable();
    console.log(this.cashBookForm.value);
    if (this.cashBookForm.valid) {
      this.dialogRef.close(this.cashBookForm.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
