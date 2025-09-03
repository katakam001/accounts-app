import { Component, Inject, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { MatIconModule } from '@angular/material/icon';
import { CashEntriesService } from '../../services/cash-entries.service';
import { minArrayLengthValidator } from '../..//validators';
import { notZeroValidator } from '../..//validators';
import { exclusiveCashAmountValidator } from '../../validators';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-cash-book-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, MatSelectModule, MatInputModule, MatDatepickerModule, MatAutocompleteModule, MatDialogModule, MatIconModule, SupplierFilterPipe],
  templateUrl: './add-cash-book-dialog.component.html',
  styleUrls: ['./add-cash-book-dialog.component.css']
})
export class AddCashBookDialogComponent implements OnInit {
  cashBookForm: FormGroup;
  accountList: { id: number, name: string, group_id: number }[] = [];
  narrations = ['CASH-PAID', 'CASH DEPOSIT', 'CASH RECEIVED', 'TRANSFER', 'CUSTOM'];
  isCustomNarration: boolean[] = [];
  runningBalance = 0;
  orgRunningBalance = 0;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddCashBookDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private accountService: AccountService,
    private cashEntriesService: CashEntriesService,
    private datePipe: DatePipe,
    private snackBar: MatSnackBar,
    private storageService: StorageService
  ) { }

  ngOnInit(): void {
    this.runningBalance = parseFloat(this.data.currentBalance);
    this.orgRunningBalance = this.runningBalance;

    this.cashBookForm = this.fb.group({
      cash_entry_date: [null, Validators.required],
      cash_account_id: [0, [Validators.required, notZeroValidator]], // Shared across all entries
      cash_group_id: [0, [Validators.required, notZeroValidator]],   // Shared across all entries
      entries: this.fb.array([], [minArrayLengthValidator(1)]) // Dynamic list of entry rows
    });

    this.fetchAccountList();
    this.addEntry(); // Start with one entry
  }

  get entries(): FormArray {
    return this.cashBookForm.get('entries') as FormArray;
  }

  createEntry(): FormGroup {
    return this.fb.group({
      account_name: [null, Validators.required],
      narration: [null, Validators.required],
      narration_description: [{ value: '', disabled: true }, Validators.required],
      cash_debit: [0, Validators.required],
      cash_credit: [0, Validators.required],
      amount: [0, [Validators.required, notZeroValidator]],
      account_id: [0, [Validators.required, notZeroValidator]],
      group_id: [0, [Validators.required, notZeroValidator]],
      type: [false, Validators.required]
    }, { validators: exclusiveCashAmountValidator });
  }

  addEntry(): void {
    this.entries.push(this.createEntry());
    this.isCustomNarration.push(false);
  }

  removeEntry(index: number): void {
    this.entries.removeAt(index);
    this.isCustomNarration.splice(index, 1);
    this.updateRunningBalance();
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

  onAccountSelectionChange(account: any, index: number): void {
    const entry = this.entries.at(index);
    entry.patchValue({
      account_id: account.id,
      group_id: account.group_id,
      account_name: account.name
    });
  }

  onNarrationChange(value: string, index: number): void {
    const entry = this.entries.at(index) as FormGroup;
    const isCustom = value === 'CUSTOM';
    this.isCustomNarration[index] = isCustom;

    const narrationControl = entry.get('narration_description');
    if (isCustom) {
      narrationControl?.enable();
      narrationControl?.setValue('');
    } else {
      narrationControl?.disable();
      narrationControl?.setValue(value);
    }
  }

  updateRunningBalance(): void {
    const totalDebit = this.entries.controls.reduce((sum, entry: AbstractControl) => {
      return sum + (parseFloat(entry.get('cash_debit')?.value) || 0);
    }, 0);

    const totalCredit = this.entries.controls.reduce((sum, entry: AbstractControl) => {
      return sum + (parseFloat(entry.get('cash_credit')?.value) || 0);
    }, 0);

    this.runningBalance = this.orgRunningBalance - totalDebit + totalCredit;
  }

  identifyInvalidFields(form: FormGroup | FormArray): void {
    Object.keys(form.controls).forEach(field => {
      const control = form.get(field);
      if (control instanceof FormControl) {
        if (control.invalid) {
          console.log(`Invalid Field: ${field}, Error: ${JSON.stringify(control.errors)}`);
        }
      } else if (control instanceof FormGroup || control instanceof FormArray) {
        if (control.invalid) {
          console.log(`Invalid Group/Array: ${field}, Error: ${JSON.stringify(control.errors)}`);
        }
        this.identifyInvalidFields(control); // recurse into children
      }
    });
  }

  onSave(): void {
    this.entries.controls.forEach((entry: AbstractControl) => {
      entry.get('narration_description')?.enable(); // ensure it's included
      const debit = parseFloat(entry.get('cash_debit')?.value) || 0;
      const credit = parseFloat(entry.get('cash_credit')?.value) || 0;
      entry.patchValue({
        amount: debit > 0 ? debit : credit,
        type: credit > 0
      });
    });

    if (this.cashBookForm.valid) {
      const payload = {
        cash_date: this.datePipe.transform(this.cashBookForm.value.cash_entry_date, 'yyyy-MM-dd', 'en-IN'),
        user_id: this.storageService.getUser().id,
        financial_year: this.data.financialYear,
        cash_account_id: this.cashBookForm.value.cash_account_id,
        cash_group_id: this.cashBookForm.value.cash_group_id,
        entries: this.cashBookForm.value.entries
      };
      this.cashEntriesService.addBulkCashEntries(payload).subscribe((response) => {
        this.dialogRef.close(response);
      });
    } else {
      this.identifyInvalidFields(this.cashBookForm);
      this.entries.controls.forEach((entry: AbstractControl) => {
        entry.get('narration_description')?.disable(); // ensure it's included
      });
      this.snackBar.open('Please fill all required fields.', 'Close', {
        duration: 3000,
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
