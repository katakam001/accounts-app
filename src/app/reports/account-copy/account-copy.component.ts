import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { LedgerService } from '../../services/ledger.service';
import { WebSocketService } from '../../services/websocket.service';
import { CommonModule, DatePipe } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AccountService } from '../../services/account.service';
import { StorageService } from '../../services/storage.service';
import { FinancialYearService } from '../../services/financial-year.service';
import { saveAs } from 'file-saver';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { SupplierFilterPipe } from '../../pipe/supplier-filter.pipe';
import { MatInputModule } from '@angular/material/input';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-account-copy',
  standalone: true,
  imports: [MatInputModule, ReactiveFormsModule, CommonModule, MatIconModule, MatAutocompleteModule, SupplierFilterPipe, FormsModule, MatDatepickerModule, MatNativeDateModule, MatSnackBarModule],
  templateUrl: './account-copy.component.html',
  styleUrls: ['./account-copy.component.css']
})
export class AccountCopyComponent implements OnInit, OnDestroy {
  selectedAccountId: number;
  financialYear: string;
  accountList: any[] = [];
  userId: number;
  entries: any[] = [];
  groupedEntries: any[] = [];
  pageSize = 400; // Fixed page size
  nextStartRow = 1;
  hasMore = true;
  inMemomryforwardExist = false;
  currentIndex: number = -1; // Tracks the current position in accountIndex
  startCursor: { account_id: number; entry_id: string } | null = null; // To store the starting cursor
  endCursor: { account_id: number; entry_id: string } | null = null;  // To store the ending cursor
  startAccountIdentryId: string;
  fromDate: Date | null = null; // Store the 'from' date
  toDate: Date | null = null;
  financialYearstartDate: Date;
  financialYearendDate: Date;
  isTrailBalanceDrilldownActive: boolean = false;
  searchName: FormControl = new FormControl(''); // FormControl for input field
  private subscription: Subscription = new Subscription(); // Initialize the subscription
  constructor(
    private ledgerService: LedgerService,
    private dbService: NgxIndexedDBService,
    private webSocketService: WebSocketService,
    private accountService: AccountService,
    private storageService: StorageService,
    private datePipe: DatePipe,
    private route: ActivatedRoute,
    private financialYearService: FinancialYearService,
    private router: Router, // Inject Router
    private snackBar: MatSnackBar // Inject MatSnackBar
  ) { }

  ngOnInit(): void {
    console.log('ngOnInit called');
    console.log(this.selectedAccountId);
    this.clearCache();
    this.getFinancialYear();
    this.userId = this.storageService.getUser().id;
    this.fetchAccountList();
    this.subscribeToWebSocketEvents(); // Subscribe to WebSocket events
  }

  ngOnDestroy() {
    this.subscription.unsubscribe(); // Clean up the subscription
    this.webSocketService.close();
  }

  fetchAccountList(): void {
    console.log('fetchAccountList called');
    this.accountService.getAccountsByUserIdAndFinancialYear(this.userId, this.financialYear).subscribe((accounts: any[]) => {
      this.accountList = accounts.map(account => ({
        id: account.id,
        name: account.name
      }));
      this.route.queryParams.subscribe(params => {
        if (params['accountId']) {
          this.selectedAccountId = Number(params['accountId']);
          this.fromDate = new Date(params['fromDate']);
          this.toDate = new Date(params['toDate']);
          this.isTrailBalanceDrilldownActive = true;
        }
        // console.log(typeof this.selectedAccountId); // Should match stored key type
        // console.log(this.fromDate instanceof Date); // ✅ true if it's a Date object
        // console.log(this.toDate instanceof Date); // ✅ true if it's a Date object
        // console.log(this.selectedAccountId);
        this.accountList.forEach(account => {
          if (account.id == this.selectedAccountId) {
            this.searchName.patchValue(account.name);
          }
        });
        if (this.selectedAccountId != null)
          this.applyDateFilter();
      });
    });
  }

  onAccountSelectionChange(event: any): void {
    console.log('onAccountSelectionChange called');
    this.selectedAccountId = event.id;
    this.searchName.patchValue(event.name);
  }

  exportToPDF(): void {
    this.ledgerService.exportToPDF(this.selectedAccountId, this.userId, this.financialYear).subscribe((response: Blob) => {
      saveAs(response, `ledger_${this.userId}_${this.financialYear}.pdf`);
    }, error => {
      console.error('Error exporting PDF:', error);
    });
  }

  exportToExcel(): void {
    this.ledgerService.exportToExcel(this.selectedAccountId, this.userId, this.financialYear).subscribe((response: Blob) => {
      saveAs(response, `ledger_${this.userId}_${this.financialYear}.xlsx`);
    }, error => {
      console.error('Error exporting Excel:', error);
    });
  }

  navigateToTrailBalance(): void {
    this.router.navigate(['/trailBalance'], {
      queryParams: {
        fromDate: this.fromDate,
        toDate: this.toDate
      }
    });
  }

  getFinancialYear() {
    const storedFinancialYear = this.financialYearService.getStoredFinancialYear();
    if (storedFinancialYear) {
      this.financialYear = storedFinancialYear;
      const [startYear, endYear] = this.financialYear.split('-').map(Number);
      this.financialYearstartDate = new Date(startYear, 3, 1); // April 1st of start year
      this.financialYearendDate = new Date(endYear, 2, 31); // March 31st of end year
      this.fromDate = this.financialYearstartDate;
      this.toDate = this.financialYearendDate;
    }
  }

  applyDateFilter(): void {
    if (!this.selectedAccountId) {
      this.snackBar.open('Please select an account before applying filter.', 'Close', {
        duration: 3000,
        panelClass: ['snackbar-warning']
      });
      return;
    }
    if (this.fromDate && this.toDate) {
      this.clearCache();
      // Clear cache and reset pagination
      this.entries = [];
      this.groupedEntries = [];
      this.hasMore = true;
      this.nextStartRow = 1;
      this.currentIndex = -1;
      this.startAccountIdentryId = '';
      this.inMemomryforwardExist = false;
      // Trigger fetchEntries to load filtered data
      this.loadEntries();
    }
  }

  dateFilter = (date: Date | null): boolean => {
    if (!date) {
      return false; // Ignore null dates
    }

    // Return whether the date falls within the financial year range
    return date >= this.financialYearstartDate && date <= this.financialYearendDate;
  };

  loadEntries(): void {
    const fromDateStr = this.datePipe.transform(this.fromDate, 'yyyy-MM-dd', 'en-IN') as string; // Transform to desired format
    const toDateStr = this.datePipe.transform(this.toDate, 'yyyy-MM-dd', 'en-IN') as string; // Transform to desired format  
    this.ledgerService
      .getLedger(this.selectedAccountId, this.userId, this.financialYear, this.nextStartRow, this.pageSize, fromDateStr, toDateStr)
      .subscribe((response) => {
        this.entries = response.entries;
        this.nextStartRow = response.nextStartRow;
        this.hasMore = response.hasMore;

        // Group entries
        this.groupEntries();

        // Process grouped entries without redundant index updates
        Promise.all(
          this.groupedEntries.map((group: any) =>
            this.saveAccountEntries(group.account_id, group.account_name, group.entries).then(() => {
              // console.log(`Successfully processed account_id: ${group.account_id}`);
            })
          )
        )
      });
  }

  clearCache(): void {
    this.dbService.clear('accountCopyEntries').subscribe({
      next: () => console.log('IndexedDB accountCopyEntries store cleared'),
      error: (error: any) => console.error('Error clearing IndexedDB accountCopyEntries store:', error)
    });
  }
  groupEntries(): void {
    const grouped = new Map();
    let startCursor: { account_id: number; entry_id: string } | null = null; // To store the starting cursor
    let endCursor: { account_id: number; entry_id: string } | null = null;  // To store the ending cursor
    this.entries.forEach((entry, index) => {
      const accountId = entry.account_id;
      const entryId = entry.entry_id;

      if (accountId) { // Ensure account_id is valid
        if (!grouped.has(accountId)) {
          grouped.set(accountId, {
            account_id: accountId, // Include account_id in grouped data
            account_name: entry.account_name,
            entries: [],
          });
        }

        grouped.get(accountId).entries.push(entry); // Add entry to the grouped list

        // Set the starting cursor (only for the first entry)
        if (!startCursor) {
          startCursor = {
            account_id: accountId,
            entry_id: entryId,
          };
        }
        if (!this.startAccountIdentryId) {
          this.startAccountIdentryId = entryId;
        }

        // Update the ending cursor (for every entry, ensures the last entry is stored)
        endCursor = {
          account_id: accountId,
          entry_id: entryId,
        };
      } else {
        console.warn('Skipping entry with missing account_id:', entry);
      }
    });

    // Save grouped entries for use
    this.groupedEntries = Array.from(grouped.values()); // Convert map to array

    // Log starting and ending cursors for pagination
    // console.log('Start Cursor:', startCursor);
    // console.log('End Cursor:', endCursor);

    // Update pagination cursors
    this.startCursor = startCursor; // Save starting cursor
    this.endCursor = endCursor;     // Save ending cursor
    console.log(this.groupedEntries);
  }

  saveAccountEntries(accountId: number, accountName: string, entries: any[]): Promise<void> {
    return new Promise((resolve, reject) => {
      this.dbService.getByKey('accountCopyEntries', accountId).subscribe((existingData: any) => {
        if (existingData) {
          // Merge entries and maintain insertion order
          const mergedEntries = [...existingData.entries, ...entries].sort(
            (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()
          );

          // Update the accountCopyEntries store
          this.dbService.update('accountCopyEntries', {
            account_id: accountId,
            account_name: accountName,
            entries: mergedEntries,
          }).subscribe(() => {
            // Update account index after successful save
          }, (err) => reject(err));
        } else {
          // Add new data to the accountCopyEntries store
          this.dbService.add('accountCopyEntries', {
            account_id: accountId,
            account_name: accountName,
            entries,
          }).subscribe(() => {
            this.currentIndex++;
          }, (err) => reject(err));
        }
      }, (err) => reject(err));
    });
  }

  nextPage(): void {
    if (this.hasMore || this.inMemomryforwardExist) {
      if (this.inMemomryforwardExist) {
        this.fetchPageDataForward(this.pageSize).then((paginatedEntries) => {
          this.entries = paginatedEntries;
          this.groupEntries();
        });
      } else if (this.hasMore && !this.inMemomryforwardExist) {
        this.loadEntries();
      }
    } else {
      console.warn('No more data available for forward navigation');
    }
  }

  previousPage(): void {
    this.inMemomryforwardExist = true;
    if (this.currentIndex >= -1) {
      this.fetchPageDataBackward(this.pageSize).then((paginatedEntries) => {
        this.entries = paginatedEntries;
        this.groupEntries();
      });
    } else {
      console.warn('No previous data available for backward navigation');
    }
  }

  async fetchPageDataForward(pageSize: number): Promise<any[]> {
    const paginatedEntries: any[] = [];
    let rowCount = 0;

    while (rowCount < pageSize) {
      // console.log(`Processing accountId for forward navigation: ${accountId}`);

      // Skip accounts already processed in this.groupedEntries, except the account related to startCursor
      const isProcessedAccount =
        this.groupedEntries.some((group: any) => group.account_id === this.selectedAccountId) &&
        this.selectedAccountId !== this.endCursor?.account_id;

      if (isProcessedAccount) {
        // console.log(`Skipping already processed accountId: ${accountId}`);
        this.currentIndex++; // Skip this account and move to the previous one
        continue; // Continue the loop without processing this account
      }

      const accountData: any = await this.dbService.getByKey('accountCopyEntries', this.selectedAccountId).toPromise();

      if (accountData?.entries) {
        let startIndex = 0;

        // Skip entries already processed in the previous page using endCursor
        if (this.selectedAccountId === this.endCursor?.account_id) {
          startIndex = accountData.entries.findIndex((entry: any) => entry.entry_id === this.endCursor?.entry_id) + 1; // Start after endCursor
        }
        let accountRowCount = 0; // Tracks the number of rows processed for the current account
        for (let i = startIndex; i < accountData.entries.length && rowCount < pageSize; i++) {
          const entry = accountData.entries[i];
          paginatedEntries.push(entry); // Add entry to the page
          rowCount++;
          accountRowCount++;
        }
        if (startIndex + accountRowCount === accountData.entries.length) {
          console.log("inmemoryforwardExist");
          this.inMemomryforwardExist = false;
          break;
        }
        if (startIndex + accountRowCount === accountData.entries.length) {
          // console.log(`Finished processing all entries for accountId: ${accountId}`);
          this.currentIndex++; // Move to the previous account
        }
      } else {
        console.warn(`No entries found for accountId: ${this.selectedAccountId}`);
      }
    }
    return paginatedEntries;
  }

  async fetchPageDataBackward(pageSize: number): Promise<any[]> {
    const paginatedEntries: any[] = [];
    let rowCount = 0;

    while (rowCount < pageSize) {

      // Skip accounts already processed in this.groupedEntries, except the account related to startCursor
      const isProcessedAccount =
        this.groupedEntries.some((group: any) => group.account_id === this.selectedAccountId) &&
        this.selectedAccountId !== this.startCursor?.account_id;

      if (isProcessedAccount) {
        // console.log(`Skipping already processed accountId: ${accountId}`);
        this.currentIndex--; // Skip this account and move to the previous one
        continue; // Continue the loop without processing this account
      }

      // console.log(`Processing accountId for backward navigation: ${accountId}`);

      const accountData: any = await this.dbService.getByKey('accountCopyEntries', this.selectedAccountId).toPromise();
      console.log(accountData);

      if (accountData?.entries) {
        let endIndex = accountData.entries.length - 1;

        // Skip entries already processed in the current page using startCursor
        if (this.selectedAccountId === this.startCursor?.account_id) {
          endIndex = accountData.entries.findIndex((entry: any) => entry.entry_id === this.startCursor?.entry_id) - 1; // End before startCursor
        }
        let accountRowCount = 0; // Tracks the number of rows processed for the current account

        for (let i = endIndex; i >= 0 && rowCount < pageSize; i--) {
          const entry = accountData.entries[i];
          paginatedEntries.unshift(entry); // Add entry to the page in reverse order
          rowCount++;
          accountRowCount++;
        }

        // Only decrement currentIndex when all entries for the current account have been processed
        if (accountRowCount === endIndex + 1) {
          // console.log(`Finished processing all entries for accountId: ${accountId}`);
          this.currentIndex--; // Move to the previous account
        }
      } else {
        console.warn(`No entries found for accountId: ${this.selectedAccountId}`);
      }

    }

    return paginatedEntries;
  }

  async getAccountName(accountId: number): Promise<string> {
    const account = await this.accountService.getAccount(this.storageService.getUser().id, this.financialYear, undefined, accountId).toPromise();
    return account ? account.name : 'Unknown Account';
  }

  subscribeToWebSocketEvents(): void {
    const currentUserId = this.storageService.getUser().id;
    const currentFinancialYear = this.financialYear;
    const entryTypes = ['entry', 'journal', 'cash'];

    entryTypes.forEach(type => {
      this.subscription.add(
        this.webSocketService.onEvent('INSERT').subscribe(async (data: any) => {
          const entryDate = data.entryType === 'cash' ? new Date(data.cash_date).getTime() : new Date(data.journal_date).getTime();
          const fromDateTimestamp = this.fromDate ? new Date(Date.UTC(this.fromDate.getFullYear(), this.fromDate.getMonth(), this.fromDate.getDate())).getTime() : null; // Convert fromDate to timestamp
          const toDateTimestamp = this.toDate ? new Date(Date.UTC(this.toDate.getFullYear(), this.toDate.getMonth(), this.toDate.getDate())).getTime() : null; // Convert toDate to timestamp      
          if (data.entryType === type && data.user_id === currentUserId && data.financial_year === currentFinancialYear &&
            (!fromDateTimestamp || entryDate >= fromDateTimestamp) && // Check if entryDate is on or after fromDate
            (!toDateTimestamp || entryDate <= toDateTimestamp)) {
            console.log("first");
            await this.handleInsertEvent(data.data, type);
          }
        })
      );
      this.subscription.add(
        this.webSocketService.onEvent('UPDATE').subscribe(async (data: any) => {
          const entryDate = data.entryType === 'cash' ? new Date(data.cash_date).getTime() : new Date(data.journal_date).getTime();
          const fromDateTimestamp = this.fromDate ? new Date(Date.UTC(this.fromDate.getFullYear(), this.fromDate.getMonth(), this.fromDate.getDate())).getTime() : null; // Convert fromDate to timestamp
          const toDateTimestamp = this.toDate ? new Date(Date.UTC(this.toDate.getFullYear(), this.toDate.getMonth(), this.toDate.getDate())).getTime() : null; // Convert toDate to timestamp      
          if (data.entryType === type && data.user_id === currentUserId && data.financial_year === currentFinancialYear &&
            (!fromDateTimestamp || entryDate >= fromDateTimestamp) && // Check if entryDate is on or after fromDate
            (!toDateTimestamp || entryDate <= toDateTimestamp)) {
            console.log("second");
            await this.handleUpdateEvent(data.data, type);
          }
        })
      );
      this.subscription.add(
        this.webSocketService.onEvent('DELETE').subscribe(async (data: any) => {
          const entryDate = data.entryType === 'cash' ? new Date(data.cash_date).getTime() : new Date(data.journal_date).getTime();
          const fromDateTimestamp = this.fromDate ? new Date(Date.UTC(this.fromDate.getFullYear(), this.fromDate.getMonth(), this.fromDate.getDate())).getTime() : null; // Convert fromDate to timestamp
          const toDateTimestamp = this.toDate ? new Date(Date.UTC(this.toDate.getFullYear(), this.toDate.getMonth(), this.toDate.getDate())).getTime() : null; // Convert toDate to timestamp      
          if (data.entryType === type && data.user_id === currentUserId && data.financial_year === currentFinancialYear &&
            (!fromDateTimestamp || entryDate >= fromDateTimestamp) && // Check if entryDate is on or after fromDate
            (!toDateTimestamp || entryDate <= toDateTimestamp)) {
            console.log("third");
            await this.handleDeleteEvent(data.data, type);
          }
        })
      );
    });
  }

  async handleInsertEvent(data: any, type: string): Promise<void> {
    let newEntry: any;

    if (type === 'entry' || type === 'journal') {
      console.log("insert");
      const journalEntry = data.journalEntry || data;
      for (const item of journalEntry.items) {
        const accountName = await this.getAccountName(item.account_id);
        console.log(item);
        console.log(journalEntry);

        newEntry = {
          entry_id: journalEntry.id.toString(),
          date: this.datePipe.transform(journalEntry.journal_date, 'yyyy-MM-dd', 'en-IN'),
          account_name: accountName,
          account_id: item.account_id,
          group_id: item.group_id,
          narration: item.narration,
          type: item.type,
          amount: parseFloat(item.amount).toFixed(2) // Convert to float and fix two decimals
        };

        await this.insertEntry(item.account_id, newEntry);
      }
    } else if (type === 'cash') {
      const entry = data;
      const accountName = await this.getAccountName(entry.account_id);

      newEntry = {
        entry_id: entry.unique_entry_id,
        date: this.datePipe.transform(entry.cash_date, 'yyyy-MM-dd', 'en-IN'),
        account_name: accountName,
        account_id: entry.account_id,
        group_id: entry.group_id,
        narration: entry.narration,
        type: entry.type,
        amount: parseFloat(entry.amount).toFixed(2) // Convert to float and fix two decimals
      };

      await this.insertEntry(entry.account_id, newEntry);
    }
  }
  async insertEntry(accountId: number, newEntry: any): Promise<void> {
    console.log(accountId);
    console.log(newEntry);
    const accountData: any = await this.dbService.getByKey('accountCopyEntries', accountId).toPromise();

    if (accountData) {
      // Merge new entry and recalculate balances
      accountData.entries.push(newEntry);
      accountData.entries.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

      let balance = 0;
      accountData.entries.forEach((entry: any) => {
        if (entry.type) {
          balance += parseFloat(entry.amount);
        } else {
          balance -= parseFloat(entry.amount);
        }
        entry.balance = balance.toFixed(2);
      });
      // Update the database
      await this.dbService.update('accountCopyEntries', accountData).toPromise();
      console.log(`Real-time update processed for account_id: ${accountId}`);
      this.updateGroupedEntries(accountId, accountData);
    }
  }
  updateGroupedEntries(accountId: number, accountData: any): void {
    // Find the group in groupedEntries for the given accountId
    const groupIndex = this.groupedEntries.findIndex(group => group.account_id === accountId);

    if (groupIndex !== -1) {
      const group = this.groupedEntries[groupIndex];

      // Get the range of current page entries
      const startEntryId = group.entries[0]?.entry_id; // Starting entry of the current page
      const endEntryId = group.entries[group.entries.length - 1]?.entry_id; // Last entry of the current page

      // Find indices in accountData.entries that correspond to this range
      const startIndex = accountData.entries.findIndex((entry: any) => entry.entry_id === startEntryId);
      const endIndex = accountData.entries.findIndex((entry: any) => entry.entry_id === endEntryId);

      // Slice the relevant data from accountData.entries
      const updatedEntries = accountData.entries.slice(
        Math.max(startIndex, 0), // Ensure startIndex is valid
        endIndex !== -1 ? endIndex + 1 : accountData.entries.length // Include endIndex or slice till the end
      );

      // Update the current group's entries
      group.entries = updatedEntries;

      console.log(`Updated groupedEntries for account_id: ${accountId} with range ${startEntryId} to ${endEntryId}`);
    } else {
      console.log(`AccountId ${accountId} not found in current page groupedEntries. Skipping update.`);
    }
  }

  async handleUpdateEvent(data: any, type: string): Promise<void> {
    let updatedEntry: any;

    if (type === 'entry' || type === 'journal') {
      const journalEntry = data.journalEntry || data;
      for (const item of journalEntry.items) {
        const accountName = await this.getAccountName(item.account_id);
        console.log(item);
        updatedEntry = {
          entry_id: journalEntry.id.toString(),
          date: this.datePipe.transform(journalEntry.journal_date, 'yyyy-MM-dd', 'en-IN'),
          account_name: accountName,
          account_id: item.account_id,
          group_id: item.account_id,
          narration: item.narration,
          type: item.type,
          amount: parseFloat(item.amount).toFixed(2) // Convert to float and fix two decimals
        };

        await this.handleRealTimeUpdate(item.account_id, updatedEntry); // Ensure sequential update
      }
    } else if (type === 'cash') {
      const entry = data;
      const updatedEntry = {
        entry_id: entry.unique_entry_id,
        date: this.datePipe.transform(entry.cash_date, 'yyyy-MM-dd', 'en-IN'),
        account_name: await this.getAccountName(entry.account_id),
        account_id: entry.account_id,
        group_id: entry.group_id,
        narration: entry.narration,
        type: entry.type,
        amount: parseFloat(entry.amount).toFixed(2) // Convert to float and fix two decimals
      };
      console.log(updatedEntry);

      await this.handleRealTimeUpdate(entry.account_id, updatedEntry); // Ensure sequential update
    }
  }

  async handleRealTimeUpdate(accountId: number, updatedEntry: any): Promise<void> {
    console.log(accountId);
    const accountData: any = await this.dbService.getByKey('accountCopyEntries', accountId).toPromise();

    if (accountData) {
      // Find the entry by entry_id
      const index = accountData.entries.findIndex((entry: any) => entry.entry_id === updatedEntry.entry_id);

      if (index !== -1) {
        accountData.entries[index] = updatedEntry; // Replace with updated entry
        accountData.entries.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

        let balance = 0;
        accountData.entries.forEach((entry: any) => {
          if (entry.type) {
            balance += parseFloat(entry.amount);
          } else {
            balance -= parseFloat(entry.amount);
          }
          entry.balance = balance.toFixed(2);
        });

        // Save the updated data back into IndexedDB
        await this.dbService.update('accountCopyEntries', accountData).toPromise();
        console.log(`Updated entry_id: ${updatedEntry.entry_id} for account_id: ${accountId}`);
        this.updateGroupedEntries(accountId, accountData);
      } else {
        console.warn('Entry to update not found.');
      }
    }
  }

  async handleDeleteEvent(data: any, type: string): Promise<void> {
    if (type === 'entry' || type === 'journal') {
      const id = type === 'entry' ? data.group.journal_id.toString() : data.id.toString();
      const account_ids = type === 'entry' ? data.group.account_ids : data.account_ids;
      console.log(account_ids);
      if (account_ids && account_ids.length > 0) {
        for (const accountId of account_ids) {
          console.log(`Processing deletion for account_id: ${accountId}`);
          await this.handleRealTimeDelete(accountId, id); // Call the delete logic for each account_id
        }
      } else {
        console.warn('No account_ids provided for deletion.');
      }
    } else if (type === 'cash') {
      const unique_entry_id = data.unique_entry_id;

      if (unique_entry_id) {
        console.log(`Processing cash entry deletion for unique_entry_id: ${unique_entry_id}`);
        await this.handleRealTimeDelete(data.account_id, unique_entry_id); // Delete for cash entry
      } else {
        console.warn('No unique_entry_id provided for deletion.');
      }
    }
  }

  async handleRealTimeDelete(accountId: number, entryId: string): Promise<void> {
    const accountData: any = await this.dbService.getByKey('accountCopyEntries', accountId).toPromise();

    if (accountData) {
      // Filter out the entry using entry_id
      accountData.entries = accountData.entries.filter((entry: any) => entry.entry_id !== entryId);
      accountData.entries.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

      let balance = 0;
      accountData.entries.forEach((entry: any) => {
        if (entry.type) {
          balance += parseFloat(entry.amount);
        } else {
          balance -= parseFloat(entry.amount);
        }
        entry.balance = balance.toFixed(2);
      });

      // Save the updated entries back into IndexedDB
      await this.dbService.update('accountCopyEntries', accountData).toPromise();
      console.log(`Deleted entry_id: ${entryId} for account_id: ${accountId}`);
      this.updateGroupedEntriesOnDelete(accountId, entryId, accountData);
    } else {
      console.warn(`No entries found for account_id: ${accountId}`);
    }
  }

  updateGroupedEntriesOnDelete(accountId: number, deletedEntryId: string, accountData: any): void {
    const groupIndex = this.groupedEntries.findIndex(group => group.account_id === accountId);

    if (groupIndex !== -1) {
      const group = this.groupedEntries[groupIndex];

      // Filter out the deleted entry from the group's entries
      group.entries = group.entries.filter((entry: any) => entry.entry_id !== deletedEntryId);

      // Check if starting or ending entry was deleted
      const startEntryId = group.entries[0]?.entry_id;
      const endEntryId = group.entries[group.entries.length - 1]?.entry_id;

      const startIndex = accountData.entries.findIndex((entry: any) => entry.entry_id === startEntryId);
      const endIndex = accountData.entries.findIndex((entry: any) => entry.entry_id === endEntryId);

      // Slice and adjust the current visible range if needed
      const updatedEntries = accountData.entries.slice(
        Math.max(startIndex, 0),
        endIndex !== -1 ? endIndex + 1 : accountData.entries.length
      );

      group.entries = updatedEntries;

      // If groupedEntries is not empty, calculate startCursor and endCursor
      if (this.groupedEntries.length > 0) {
        // Start cursor from the first index of groupedEntries
        const startGroup = this.groupedEntries[0];
        this.startCursor = {
          account_id: startGroup.account_id,
          entry_id: startGroup.entries[0]?.entry_id, // First entry in the first group
        };
        if (deletedEntryId === this.startAccountIdentryId) {
          this.startAccountIdentryId = this.startCursor.entry_id;
        }

        // End cursor from the last index of groupedEntries
        const endGroup = this.groupedEntries[this.groupedEntries.length - 1];
        this.endCursor = {
          account_id: endGroup.account_id,
          entry_id: endGroup.entries[endGroup.entries.length - 1]?.entry_id, // Last entry in the last group
        };
      } else {
        // If all entries are deleted, reset cursors
        this.startCursor = null;
        this.endCursor = null;
      }

      console.log(`Updated groupedEntries for account_id: ${accountId} after deletion.`);
      console.log(`Start Cursor Updated:`, this.startCursor);
      console.log(`End Cursor Updated:`, this.endCursor);
    } else {
      console.warn(`AccountId ${accountId} not found in groupedEntries.`);
    }
  }
}
