import { CommonModule, DatePipe } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, AbstractControl, Validators, FormControl } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { JournalItem } from '../../models/journal-item.interface';
import { AccountService } from '../../services/account.service';
import { GroupService } from '../../services/group.service';
import { Account } from '../../models/account.interface';
import { Group } from '../../models/group.interface';
import { JournalEntry } from '../../models/journal-entry.interface';
import { JournalService } from '../../services/journal.service';
import { StorageService } from '../../services/storage.service';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { SupplierFilterPipe } from '../../pipe/supplier-filter.pipe';
import { GroupFilterPipe } from '../../pipe/group-filter.pipe';
import { MatSnackBar } from '@angular/material/snack-bar';
import { minArrayLengthValidator } from '../..//validators';
import { notZeroValidator } from '../..//validators';
import { exclusiveAmountValidator } from '../../validators';
import moment from 'moment';

@Component({
  selector: 'app-edit-journal-entry-dialog',
  standalone: true,
  imports: [MatInputModule, ReactiveFormsModule, MatIconModule, CommonModule, MatSelectModule, MatDialogModule, MatDatepickerModule, MatAutocompleteModule, SupplierFilterPipe, GroupFilterPipe],
  templateUrl: './edit-journal-entry-dialog.component.html',
  styleUrls: ['./edit-journal-entry-dialog.component.css']
})
export class EditJournalEntryDialogComponent implements OnInit {
  editJournalEntryForm: FormGroup;
  accountList: { id: number, name: string }[] = [];
  groupList: { id: number, name: string }[] = [];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<EditJournalEntryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private accountService: AccountService,
    private datePipe: DatePipe, // Inject DatePipe
    private groupService: GroupService,
    private journalService: JournalService,
    private snackBar: MatSnackBar,
    private storageService: StorageService,
  ) {
    this.initializeForm(); // Initialize the form with default values
  }

  ngOnInit(): void {
    if (this.data.journalId) {
      this.fetchJournalEntry(this.data.journalId);
    } else {
      this.patchFormValues(this.data);
    }
    this.fetchAccountList();
    this.fetchGroupList();
  }

  initializeForm(): void {
    this.editJournalEntryForm = this.fb.group({
      id: [null, Validators.required],
      journal_date: [null, Validators.required],
      user_id: [this.storageService.getUser().id],
      user_name: [this.storageService.getUser().username],
      financial_year: [null, Validators.required],
      items: this.fb.array([], [minArrayLengthValidator(2)])
    });
  }

  patchFormValues(entry: JournalEntry): void {
    this.editJournalEntryForm.patchValue({
      id: entry.id,
      journal_date: moment(entry.journal_date),
      user_id: entry.user_id,
      user_name: entry.user_name,
      financial_year: entry.financial_year
    });
    this.setItems(entry.items || []);
  }

  setItems(items: JournalItem[]): void {
    const itemGroups = items.map(item => this.createItemGroup(item));
    const formArray = this.fb.array(itemGroups, [minArrayLengthValidator(2)]);
    this.editJournalEntryForm.setControl('items', formArray);
  }

  fetchJournalEntry(journalId: number): void {
    this.journalService.getJournalEntryById(journalId).subscribe((entry: JournalEntry) => {
      this.patchFormValues(entry);
    });
  }

  dateFilter = (date: any): boolean => {
    if (!date) return false;

    const fy = this.editJournalEntryForm.get('financial_year')?.value;
    if (!fy || !fy.includes('-')) return true; // allow all dates if FY is not set

    const [startYear, endYear] = fy.split('-').map(Number);
    const startDate = moment(`${startYear}-04-01`).startOf('day');   // April 1st
    const endDate = moment(`${endYear}-03-31`).endOf('day');         // March 31st

    const selectedDate = moment.isMoment(date) ? date : moment(date);

    return selectedDate.isBetween(startDate, endDate, undefined, '[]'); // inclusive
  };

  get items(): FormArray {
    return this.editJournalEntryForm.get('items') as FormArray;
  }

  createItemGroup(item: any): FormGroup {
    return this.fb.group({
      journal_id: [item.journal_id, [Validators.required, notZeroValidator]],
      account_id: [item.account_id, [Validators.required, notZeroValidator]],
      group_id: [item.group_id, [Validators.required, notZeroValidator]],
      amount: [item.amount],
      type: [item.type, Validators.required],
      narration: [item.narration, Validators.required],
      account_name: [item.account_name],
      group_name: [item.group_name],
      debit_amount: [item.debit_amount, Validators.required],
      credit_amount: [item.credit_amount, Validators.required]
    }, { validators: exclusiveAmountValidator });
  }

  addItem(): void {
    this.items.push(this.createItemGroup({
      account_name: '',
      group_name: '',
      debit_amount: '0.00',
      credit_amount: '0.00',
      journal_id: this.editJournalEntryForm.value.id,
      narration: '',
      account_id: 0,
      group_id: 0,
      amount: 0,
      type: false
    }));
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
  }

  fetchAccountList(): void {
    this.accountService.getAccountsByUserIdAndFinancialYear(this.storageService.getUser().id, this.editJournalEntryForm.get('financial_year')?.value).subscribe((accounts: Account[]) => {
      this.accountList = accounts.map(account => ({
        id: account.id,
        name: account.name,
        group_id: account.group.id,
        group_name: account.group.name
      }));
    });
  }

  fetchGroupList(): void {
    this.groupService.getGroupsByUserIdAndFinancialYear(this.storageService.getUser().id, this.editJournalEntryForm.get('financial_year')?.value).subscribe((groups: Group[]) => {
      this.groupList = groups.map(group => ({
        id: group.id,
        name: group.name
      }));
    });
  }

  onAccountSelectionChange(event: any, index: number): void {
    const itemGroup = this.items.at(index) as FormGroup;
    itemGroup.patchValue({
      account_id: event.id,
      account_name: event.name,
      group_id: event.group_id,
      group_name: event.group_name
    });
  }

  onGroupSelectionChange(event: any, index: number): void {
    const itemGroup = this.items.at(index) as FormGroup;
    itemGroup.patchValue({
      group_id: event.id,
      group_name: event.name
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onDebitAmtChange(index: number) {
    const itemGroup = this.items.at(index) as FormGroup;
    const rawValue = itemGroup.get('debit_amount')?.value;
    const rounded = parseFloat(rawValue || 0).toFixed(2);
    itemGroup.get('debit_amount')?.setValue(rounded, { emitEvent: false });
  }

  onCreditAmtChange(index: number) {
    const itemGroup = this.items.at(index) as FormGroup;
    const rawValue = itemGroup.get('credit_amount')?.value;
    const rounded = parseFloat(rawValue || 0).toFixed(2);
    itemGroup.get('credit_amount')?.setValue(rounded, { emitEvent: false });
  }

  get totalDebit(): number {
    const raw = this.items.controls.reduce((sum, control) => sum + Number(control.value.debit_amount || 0), 0);
    return parseFloat(raw.toFixed(2));
  }

  get totalCredit(): number {
    const raw = this.items.controls.reduce((sum, control) => sum + Number(control.value.credit_amount || 0), 0);
    return parseFloat(raw.toFixed(2));
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
    if (this.editJournalEntryForm.valid) {
      if (this.totalDebit !== this.totalCredit) {
        this.snackBar.open('Total Debit and Credit must be equal to save the entry.', 'Close', {
          duration: 3000,
          panelClass: ['snackbar-error']
        });
        return;
      }

      const items = this.items.controls.map((control: AbstractControl) => {
        const itemGroup = control as FormGroup;
        const debitAmount = itemGroup.value.debit_amount;
        const creditAmount = itemGroup.value.credit_amount;
        const type = creditAmount > 0;
        const amount = type ? creditAmount : debitAmount;

        return {
          ...itemGroup.value,
          type,
          amount
        };
      });
      const journalEntry = {
        ...this.editJournalEntryForm.value,
        journal_date: this.datePipe.transform(this.editJournalEntryForm.get('journal_date')?.value, 'yyyy-MM-dd', 'en-IN') // Transform the date
      };
      this.journalService.updateJournalEntry({
        ...journalEntry,
        items
      }).subscribe((response) => {
        this.dialogRef.close(response);
      });
    } else {
      this.identifyInvalidFields(this.editJournalEntryForm);
      this.snackBar.open('Please fill all required fields.', 'Close', {
        duration: 3000,
      });
    }
  }
}
