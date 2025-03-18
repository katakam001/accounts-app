import { CommonModule, DatePipe } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, AbstractControl, Validators } from '@angular/forms';
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

@Component({
  selector: 'app-edit-journal-entry-dialog',
  standalone: true,
  imports: [MatInputModule, ReactiveFormsModule, MatIconModule, CommonModule, MatSelectModule, MatDialogModule, MatDatepickerModule,MatAutocompleteModule, SupplierFilterPipe,GroupFilterPipe],
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
      items: this.fb.array([])
    });
  }

  patchFormValues(entry: JournalEntry): void {
    this.editJournalEntryForm.patchValue({
      id: entry.id,
      journal_date: new Date(entry.journal_date),
      user_id: entry.user_id,
      user_name: entry.user_name,
      financial_year: entry.financial_year
    });
    this.setItems(entry.items || []);
  }

  setItems(items: JournalItem[]): void {
    const itemGroups = items.map(item => this.createItemGroup(item));
    const formArray = this.fb.array(itemGroups);
    this.editJournalEntryForm.setControl('items', formArray);
  }

  fetchJournalEntry(journalId: number): void {
    this.journalService.getJournalEntryById(journalId).subscribe((entry: JournalEntry) => {
      this.patchFormValues(entry);
    });
  }

  dateFilter = (date: Date | null): boolean => {
    if (!date || !this.editJournalEntryForm.get('financial_year')?.value) {
      return false;
    }

    const [startYear, endYear] = this.editJournalEntryForm.get('financial_year')?.value.split('-').map(Number);
    const startDate = new Date(startYear, 3, 1); // April 1st of start year
    const endDate = new Date(endYear, 2, 31); // March 31st of end year
    return date >= startDate && date <= endDate;
  };

  get items(): FormArray {
    return this.editJournalEntryForm.get('items') as FormArray;
  }

  createItemGroup(item: JournalItem): FormGroup {
    return this.fb.group({
      journal_id: [item.journal_id],
      account_id: [item.account_id],
      group_id: [item.group_id],
      amount: [item.amount],
      type: [item.type],
      narration:[item.narration],
      account_name: [item.account_name],
      group_name: [item.group_name],
      debit_amount: [item.debit_amount],
      credit_amount: [item.credit_amount]
    });
  }

  addItem(): void {
    this.items.push(this.createItemGroup({
      account_name: '',
      group_name: '',
      debit_amount: 0,
      credit_amount: 0,
      journal_id: this.editJournalEntryForm.value.id,
      narration:'',
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
        name: account.name
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
        account_name: event.name
      });
  }

  onGroupSelectionChange(event: any, index: number): void {
    const itemGroup = this.items.at(index) as FormGroup;
      itemGroup.patchValue({
        group_id: event.id,
        group_name:event.name
      });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
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
    this.dialogRef.close({
      ...journalEntry,
      items
    });
  }
}
