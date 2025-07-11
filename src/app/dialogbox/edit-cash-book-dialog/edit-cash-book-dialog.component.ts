import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { AccountService } from '../../services/account.service';
import { StorageService } from '../../services/storage.service';
import { CashEntriesService } from '../../services/cash-entries.service';
import { Account } from '../../models/account.interface';
import { CommonModule, DatePipe } from '@angular/common';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CashEntry } from '../../models/cash-entry.interface';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { SupplierFilterPipe } from '../../pipe/supplier-filter.pipe';

@Component({
  selector: 'app-edit-cash-book-dialog',
  standalone: true,
  imports: [MatInputModule, ReactiveFormsModule, CommonModule, MatSelectModule, MatDialogModule, MatDatepickerModule, MatAutocompleteModule, SupplierFilterPipe],
  templateUrl: './edit-cash-book-dialog.component.html',
  styleUrls: ['./edit-cash-book-dialog.component.css']
})
export class EditCashBookDialogComponent implements OnInit {
  cashBookForm: FormGroup;
  accountList: { id: number, name: string }[] = [];
  narrations = ['CASH-PAID', 'CASH DEPOSIT', 'CASH RECEIVED', 'TRANSFER', 'CUSTOM'];
  isCustomNarration = false;
  runningBalance: number;
  orgRunningBalance: number;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<EditCashBookDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private accountService: AccountService,
    private datePipe: DatePipe,
    private storageService: StorageService,
    private cashEntriesService: CashEntriesService
  ) {
    this.initializeForm(); // Initialize the form with default values
  }

  ngOnInit(): void {
    if (this.data.entryId) {
      this.fetchCashEntry(this.data.entryId);
    } else {
      this.patchFormValues(this.data.entry);
    }
    this.fetchAccountList();
  }

  initializeForm(): void {
    this.cashBookForm = this.fb.group({
      id: [null, Validators.required],
      unique_entry_id: [null, Validators.required],
      cash_entry_date: [null, Validators.required],
      account_id: [null, Validators.required],
      group_id: [null, Validators.required],
      account_name: [null, Validators.required],
      narration: [null, Validators.required],
      narration_description: [{ value: null, disabled: !this.isCustomNarration }, Validators.required],
      cash_debit: [null, Validators.required],
      cash_credit: [null, Validators.required],
      amount: [null, Validators.required],
      type: [null, Validators.required],
      cash_account_id: [0], // New field
      cash_group_id: [0]    // New field
    });
  }

  patchFormValues(entry: CashEntry): void {
    this.cashBookForm.patchValue({
      id: entry.id,
      unique_entry_id: entry.unique_entry_id,
      cash_entry_date: new Date(entry.cash_entry_date),
      account_id: entry.account_id,
      group_id: entry.group_id,
      account_name: entry.account_name,
      narration: this.calculateNarration(entry.narration_description),
      narration_description: entry.narration_description,
      cash_debit: entry.cash_debit,
      cash_credit: entry.cash_credit,
      amount: entry.amount,
      type: entry.type
    });
    const previous_cash_debit = parseFloat(this.cashBookForm.value.cash_debit);
    const previous_cash_credit = parseFloat(this.cashBookForm.value.cash_credit);
    this.runningBalance = parseFloat(this.data.currentBalance);
    this.orgRunningBalance = parseFloat((this.runningBalance + previous_cash_debit - previous_cash_credit).toFixed(2));
  }

  fetchCashEntry(entryId: string): void {
    this.cashEntriesService.getCashEntry(entryId).subscribe((entry: CashEntry) => {
      this.patchFormValues(entry);
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

  onAccountSelectionChange(event: any): void {
    this.cashBookForm.patchValue({
      account_id: event.id,
      account_name: event.name,
      group_id: event.group_id
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
    }
  }

  calculateNarration(narrationDescription: string): string {
    return this.narrations.includes(narrationDescription) && narrationDescription !== 'CUSTOM' ? narrationDescription : 'CUSTOM';
  }

  updateRunningBalance(): void {
    console.log("balance update");
    const cashDebit = parseFloat(this.cashBookForm.value.cash_debit) || 0; // Safely parse cash_debit
    const cashCredit = parseFloat(this.cashBookForm.value.cash_credit) || 0; // Safely parse cash_credit
    const cashDifference = cashDebit - cashCredit;
    console.log(this.orgRunningBalance);
    console.log(cashDifference);
    // Explicitly convert runningBalance to a number
    this.orgRunningBalance = parseFloat(this.orgRunningBalance.toString()) || 0; // Convert string to a number or default to 0
    this.runningBalance = parseFloat((this.orgRunningBalance - cashDifference).toFixed(2));
    // Perform the calculation and ensure precision
    console.log(this.runningBalance);
  }

  onSave(): void {
    this.cashBookForm.controls['narration_description'].enable();
    if (this.cashBookForm.valid) {
      const cashEntry = {
        ...this.cashBookForm.value,
        amount: this.cashBookForm.get('cash_debit')?.value > 0 ? this.cashBookForm.get('cash_debit')?.value : this.cashBookForm.get('cash_credit')?.value,
        user_id: this.storageService.getUser().id,
        financial_year: this.data.financialYear,
        cash_entry_date: this.datePipe.transform(this.cashBookForm.get('cash_entry_date')?.value, 'yyyy-MM-dd', 'en-IN') // Transform the date
      };
      this.dialogRef.close(cashEntry);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
