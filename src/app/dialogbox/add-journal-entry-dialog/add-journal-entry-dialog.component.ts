import { CommonModule, DatePipe } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, AbstractControl, FormControl, ValidationErrors } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AccountService } from '../../services/account.service';
import { GroupService } from '../../services/group.service';
import { Account } from '../../models/account.interface';
import { Group } from '../../models/group.interface';
import { StorageService } from '../../services/storage.service';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { SupplierFilterPipe } from '../../pipe/supplier-filter.pipe';
import { GroupFilterPipe } from '../../pipe/group-filter.pipe';

@Component({
  selector: 'app-add-journal-entry-dialog',
  standalone: true,
  imports: [ MatInputModule, ReactiveFormsModule,MatIconModule,CommonModule,MatSelectModule,MatDialogModule,MatDatepickerModule,MatAutocompleteModule, SupplierFilterPipe,GroupFilterPipe],
  templateUrl: './add-journal-entry-dialog.component.html',
  styleUrls: ['./add-journal-entry-dialog.component.css']
})
export class AddJournalEntryDialogComponent implements OnInit {
  addJournalEntryForm: FormGroup;
  accountList: { id: number, name: string }[] = [];
  groupList: { id: number, name: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddJournalEntryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: string,
    private accountService: AccountService,
    private groupService: GroupService,
    private datePipe: DatePipe, // Inject DatePipe
    private storageService: StorageService
  ) {}

  ngOnInit(): void {
    this.addJournalEntryForm = this.fb.group({
      journal_date: ['', Validators.required],
      description: ['', Validators.required],
      user_id: [this.storageService.getUser().id],
      user_name: [this.storageService.getUser().username],
      financial_year:[this.data],
      items: this.fb.array([this.createItem()])
    });
    this.fetchAccountList();
    this.fetchGroupList();
  }

  createItem(): FormGroup {
    return this.fb.group({
      account_name: ['', Validators.required],
      group_name: ['', Validators.required],
      account_id: [0],
      group_id: [0],
      debit_amount: [0, Validators.required],
      credit_amount: [0, Validators.required]
    });
  }

  dateFilter = (date: Date | null): boolean => {
    if (!date || !this.data) {
      return false;
    }

    const [startYear, endYear] = this.data.split('-').map(Number);
    const startDate = new Date(startYear, 3, 1); // April 1st of start year
    const endDate = new Date(endYear, 2, 31); // March 31st of end year
    return date >= startDate && date <= endDate;
  };

  get items(): FormArray {
    return this.addJournalEntryForm.get('items') as FormArray;
  }

  addItem(): void {
    this.items.push(this.createItem());
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
  }

  fetchAccountList(): void {
    this.accountService.getAccountsByUserIdAndFinancialYear(this.storageService.getUser().id,this.data).subscribe((accounts: Account[]) => {
      this.accountList = accounts.map(account => ({
        id: account.id,
        name: account.name
      }));
    });
  }

  fetchGroupList(): void {
    this.groupService.getGroupsByUserIdAndFinancialYear(this.storageService.getUser().id,this.data).subscribe((groups: Group[]) => {
      console.log(groups);
      this.groupList = groups.map(group => ({
        id: group.id,
        name: group.name
      }));
      console.log(this.groupList);
    });
  }

  onAccountSelectionChange(event: any, index: number): void {
    const itemGroup = this.items.at(index) as FormGroup;
      itemGroup.patchValue({
        account_id: event.id,
        account_name: event.name,
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
      ...this.addJournalEntryForm.value,
      journal_date: this.datePipe.transform(this.addJournalEntryForm.get('journal_date')?.value, 'yyyy-MM-dd', 'en-IN') // Transform the date
    };
    this.dialogRef.close({
      ...journalEntry,
      items
    });
  }
}
