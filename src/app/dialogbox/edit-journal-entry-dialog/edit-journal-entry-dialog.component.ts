import { CommonModule, DatePipe } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, AbstractControl } from '@angular/forms';
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
import { ActivatedRoute } from '@angular/router'; // Import ActivatedRoute
import { JournalEntry } from '../../models/journal-entry.interface';
import { JournalService } from '../../services/journal.service';

@Component({
  selector: 'app-edit-journal-entry-dialog',
  standalone: true,
  imports: [MatInputModule, ReactiveFormsModule, MatIconModule, CommonModule, MatSelectModule, MatDialogModule, MatDatepickerModule],
  templateUrl: './edit-journal-entry-dialog.component.html',
  styleUrls: ['./edit-journal-entry-dialog.component.css']
})
export class EditJournalEntryDialogComponent implements OnInit {
  editJournalEntryForm: FormGroup;
  accountList: { id: number, account_name: string }[] = [];
  groupList: { id: number, group_name: string }[] = [];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<EditJournalEntryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private accountService: AccountService,
    private datePipe: DatePipe, // Inject DatePipe
    private groupService: GroupService,
    private journalService: JournalService,
    private route: ActivatedRoute // Inject ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const entryId = params.get('id');

      if (entryId) {
        // Component is activated via a route with an entryId parameter
        this.fetchJournalEntry(entryId);
      } else {
        // Component is not activated via a route with an entryId parameter
        this.initializeForm();
      }
    });

    this.fetchAccountList();
    this.fetchGroupList();
  }

  initializeForm(): void {
    this.editJournalEntryForm = this.fb.group({
      id: [this.data.id],
      journal_date: [this.data.journal_date],
      description: [this.data.description],
      user_id: [this.data.user_id],
      user_name: [this.data.user_name],
      financial_year: [this.data.financial_year],
      items: this.fb.array(this.data.items.map((item: JournalItem) => this.createItemGroup(item)))
    });
  }

  fetchJournalEntry(entryId: string): void {
    // Fetch the journal entry by ID and initialize the form
    // Assuming you have a service method to fetch the journal entry by ID
    this.journalService.getJournalEntryById(parseInt(entryId)).subscribe((entry: JournalEntry) => {
      this.editJournalEntryForm = this.fb.group({
        id: [entry.id],
        journal_date: [new Date(entry.journal_date)],
        description: [entry.description],
        user_id: [entry.user_id],
        user_name: [entry.user_name],
        financial_year: [entry.financial_year],
        items: this.fb.array((entry.items || []).map((item: JournalItem) => this.createItemGroup(item)))
      });
    });
  }  

  dateFilter = (date: Date | null): boolean => {
    if (!date || !this.data) {
      return false;
    }

    const [startYear, endYear] = this.data.financial_year.split('-').map(Number);
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
    this.accountService.getAccountsByUserIdAndFinancialYear(this.data.user_id, this.data.financial_year).subscribe((accounts: Account[]) => {
      this.accountList = accounts.map(account => ({
        id: account.id,
        account_name: account.name
      }));
    });
  }

  fetchGroupList(): void {
    this.groupService.getGroupsByUserIdAndFinancialYear(this.data.user_id, this.data.financial_year).subscribe((groups: Group[]) => {
      this.groupList = groups.map(group => ({
        id: group.id,
        group_name: group.name
      }));
    });
  }

  onAccountSelectionChange(event: any, index: number): void {
    const selectedAccount = event.value;
    const itemGroup = this.items.at(index) as FormGroup;
    const selectedAccountId = this.accountList.find(account => account.account_name === selectedAccount);
    if (selectedAccountId) {
      itemGroup.patchValue({
        account_id: selectedAccountId.id,
      });
    }
  }

  onGroupSelectionChange(event: any, index: number): void {
    const selectedGroup = event.value;
    const itemGroup = this.items.at(index) as FormGroup;
    const selectedGroupId = this.groupList.find(group => group.group_name === selectedGroup);
    if (selectedGroupId) {
      itemGroup.patchValue({
        group_id: selectedGroupId.id,
      });
    }
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
