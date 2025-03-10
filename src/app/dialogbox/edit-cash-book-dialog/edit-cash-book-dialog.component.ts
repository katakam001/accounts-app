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
  imports: [MatInputModule, ReactiveFormsModule, CommonModule, MatSelectModule, MatDialogModule, MatDatepickerModule,MatAutocompleteModule, SupplierFilterPipe],
  templateUrl: './edit-cash-book-dialog.component.html',
  styleUrls: ['./edit-cash-book-dialog.component.css']
})
export class EditCashBookDialogComponent implements OnInit {
  cashBookForm: FormGroup;
  accountList: { id: number, name: string }[] = [];
  narrations = ['CASH-PAID', 'CASH DEPOSIT', 'CASH RECEIVED', 'TRANSFER', 'CUSTOM'];
  isCustomNarration = false;
  runningBalance: number;

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
      this.runningBalance = this.data.currentBalance;
    } else {
      this.patchFormValues(this.data.entry);
    }
    this.fetchAccountList();
  }

  initializeForm(): void {
    this.cashBookForm = this.fb.group({
      id: [null, Validators.required],
      cash_entry_date: [null, Validators.required],
      account_id: [null, Validators.required],
      account_name: [null, Validators.required],
      narration: [null, Validators.required],
      narration_description: [{ value: null, disabled: !this.isCustomNarration }, Validators.required],
      cash_debit: [null, Validators.required],
      cash_credit: [null, Validators.required],
      amount: [null, Validators.required],
      type: [null, Validators.required]
    });
  }

  patchFormValues(entry: CashEntry): void {
    this.cashBookForm.patchValue({
      id: entry.id,
      cash_entry_date: new Date(entry.cash_entry_date),
      account_id: entry.account_id,
      account_name: entry.account_name,
      narration: this.calculateNarration(entry.narration_description),
      narration_description: entry.narration_description,
      cash_debit: entry.cash_debit,
      cash_credit: entry.cash_credit,
      amount: entry.amount,
      type: entry.type
    });
  }

  fetchCashEntry(entryId: number): void {
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
    this.accountService.getAccountsByUserIdAndFinancialYear(this.storageService.getUser().id, this.data.financialYear).subscribe((accounts: Account[]) => {
      this.accountList = accounts.map(account => ({
        id: account.id,
        name: account.name
      }));
    });
  }

  onAccountSelectionChange(event: any): void {
      this.cashBookForm.patchValue({
        account_id: event.id,
        account_name: event.name,
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
    const cashDebit = parseFloat(this.cashBookForm.value.cash_debit) || 0;
    const cashCredit = parseFloat(this.cashBookForm.value.cash_credit) || 0;
    this.runningBalance = this.data.currentBalance - cashDebit + cashCredit;
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
