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
  selector: 'app-edit-cash-book-dialog',
  imports: [MatCardModule, MatInputModule, ReactiveFormsModule, MatCardModule, MatIconModule, CommonModule, MatSelectModule, MatDialogModule, MatDatepickerModule],
  templateUrl: './edit-cash-book-dialog.component.html',
  styleUrls: ['./edit-cash-book-dialog.component.css']
})
export class EditCashBookDialogComponent implements OnInit {
  cashBookForm: FormGroup;
  accountList: { id: number, account_name: string }[] = [];
  narrations = ['CASH-PAID', 'CASH DEPOSIT', 'CASH RECEIVED', 'TRANSFER', 'CUSTOM'];
  isCustomNarration = false;
  runningBalance: number;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<EditCashBookDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private accountService: AccountService,
    private storageService: StorageService
  ) {}

  ngOnInit(): void {
    this.runningBalance = this.data.currentBalance;
    this.cashBookForm = this.fb.group({
      id:[this.data.entry.id, Validators.required],
      cash_entry_date: [new Date(this.data.entry.cash_entry_date), Validators.required],
      account_id: [this.data.entry.account_id, Validators.required],
      account_name: [this.data.entry.account_name, Validators.required],
      narration: [this.calculateNarration(this.data.entry.narration_description), Validators.required],
      narration_description: [{ value: this.data.entry.narration_description, disabled: !this.isCustomNarration }, Validators.required],
      cash_debit: [this.data.entry.cash_debit, Validators.required],
      cash_credit: [this.data.entry.cash_credit, Validators.required],
      amount: [this.data.entry.amount, Validators.required],
      type: [this.data.entry.type, Validators.required]
    });
    this.fetchAccountList();
  }

  fetchAccountList(): void {
    this.accountService.getAccountsByUserIdAndFinancialYear(this.storageService.getUser().id, this.data.financialYear).subscribe((accounts: Account[]) => {
      this.accountList = accounts.map(account => ({
        id: account.id,
        account_name: account.name
      }));
    });
  }

  onAccountSelectionChange(event: any): void {
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
    }
  }
  calculateNarration(narrationDescription: string): string {
    return this.narrations.includes(narrationDescription) && narrationDescription !== 'CUSTOM' ? narrationDescription : 'CUSTOM';
  } 

  updateRunningBalance(): void {
    const cashDebit = parseFloat(this.cashBookForm.value.cash_debit) || 0;
    const cashCredit = parseFloat(this.cashBookForm.value.cash_credit) || 0;
    this.runningBalance = this.data.currentBalance - cashDebit + cashCredit;
  }

  onSave(): void {
    this.cashBookForm.controls['narration_description'].enable();
    if (this.cashBookForm.valid) {
      this.dialogRef.close(this.cashBookForm.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
