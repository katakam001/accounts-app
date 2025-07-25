import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { AccountService } from '../../services/account.service';
import { StorageService } from '../../services/storage.service';
import { Account } from '../../models/account.interface';
import { CommonModule, DatePipe } from '@angular/common';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { SupplierFilterPipe } from '../../pipe/supplier-filter.pipe';

@Component({
  selector: 'app-cash-book-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, MatSelectModule, MatInputModule, MatDatepickerModule, MatAutocompleteModule, SupplierFilterPipe],
  templateUrl: './add-cash-book-dialog.component.html',
  styleUrls: ['./add-cash-book-dialog.component.css']
})
export class AddCashBookDialogComponent implements OnInit {
  cashBookForm: FormGroup;
  accountList: { id: number, name: string }[] = [];
  narrations = ['CASH-PAID', 'CASH DEPOSIT', 'CASH RECEIVED', 'TRANSFER', 'CUSTOM'];
  isCustomNarration = false;
  runningBalance: number;
  orgRunningBalance: number;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddCashBookDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private accountService: AccountService,
    private datePipe: DatePipe, // Inject DatePipe
    private storageService: StorageService
  ) { }

  ngOnInit(): void {
    this.runningBalance = parseFloat(this.data.currentBalance);
    this.orgRunningBalance = this.runningBalance;
    this.cashBookForm = this.fb.group({
      cash_entry_date: [null, Validators.required],
      account_name: [null, Validators.required],
      narration: [null, Validators.required],
      narration_description: [{ value: '', disabled: true }, Validators.required],
      cash_debit: [0, Validators.required],
      cash_credit: [0, Validators.required],
      amount: [0, Validators.required],
      account_id: [0, Validators.required],
      group_id: [0, Validators.required],
      type: [false, Validators.required],
      cash_account_id: [0], // New field
      cash_group_id: [0]    // New field
    });
    this.fetchAccountList();
  }

  fetchAccountList(): void {
    this.accountService.getAccountsByUserIdAndFinancialYear(
      this.storageService.getUser().id,
      this.data.financialYear
    ).subscribe((accounts: Account[]) => {
      let cashAccount: Account | undefined;

      // Find the CASH account
      accounts.forEach(account => {
        if (account.name.trim().toUpperCase() === 'CASH') {
          cashAccount = account;
        }
      });

      // Filter out the CASH account from the list
      this.accountList = accounts
        .filter(account => account.name.trim().toUpperCase() !== 'CASH')
        .map(account => ({
          id: account.id,
          name: account.name,
          group_id: account.group.id
        }));

      // Set CASH account details in the form
      if (cashAccount) {
        this.cashBookForm.patchValue({
          cash_account_id: cashAccount.id,
          cash_group_id: cashAccount.group.id
        });
      }
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
    this.cashBookForm.patchValue({
      account_id: event.id,
      group_id: event.group_id,
      account_name: event.name
    });
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
    this.runningBalance = this.orgRunningBalance - cashDebit + cashCredit;
  }

  onSave(): void {
    this.cashBookForm.controls['narration_description'].enable();
    if (this.cashBookForm.valid) {
      const cashEntry = {
        ...this.cashBookForm.value,
        cash_entry_date: this.datePipe.transform(this.cashBookForm.get('cash_entry_date')?.value, 'yyyy-MM-dd', 'en-IN') // Transform the date
      };
      this.dialogRef.close(cashEntry);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}

