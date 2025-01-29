import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JournalService } from '../../services/journal.service';
import { FinancialYearService } from '../../services/financial-year.service';
import { StorageService } from '../../services/storage.service';
import { AccountService } from '../../services/account.service'; // Import AccountService
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { MatChipsModule } from '@angular/material/chips';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { WebSocketService } from '../../services/websocket.service'; // Import WebSocket service
import { BalanceService } from '../../services/balance.service';
import { MatDialog } from '@angular/material/dialog';
import { EditCashBookDialogComponent } from '../../dialogbox/edit-cash-book-dialog/edit-cash-book-dialog.component';
import { EditJournalEntryDialogComponent } from '../../dialogbox/edit-journal-entry-dialog/edit-journal-entry-dialog.component';
import { AddEditEntryDialogComponent } from '../../dialogbox/add-edit-entry-dialog/add-edit-entry-dialog.component';
import { Subscription } from 'rxjs'; // Import Subscription
import { DatePipe } from '@angular/common';
import saveAs from 'file-saver';

@Component({
  selector: 'app-daybook',
  standalone: true,
  imports: [
    CommonModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    FormsModule
  ],
  templateUrl: './daybook.component.html',
  styleUrls: ['./daybook.component.css']
})
export class DayBookComponent implements OnInit, OnDestroy {
  private subscription: Subscription = new Subscription(); // Initialize the subscription
  combinedEntries: any[] = [];
  dayBookEntries: any[] = []; // Initialize as an empty array
  groupedDayBookEntries: any[] = [];
  userId: number;
  financialYear: string;
  limit: number = 100; // Align limit with pageSize
  offset: number = 0; // Example offset
  totalPages: number = 0;
  cacheKeys: string[] = [];
  currentPage: number = 1;
  pageSize: number = 100; // Number of records per page
  dataFetchCounter: number = 0; // Counter to track data fetching
  fetchEntriesSubject: Subject<void> = new Subject<void>(); // Subject for debouncing
  inMemoryCache: Map<string, any[]> = new Map(); // In-memory cache with LRU eviction
  maxCacheSize: number = 5; // Maximum number of pages to store in memory
  entryTypes = [
    { label: 'Purchase', value: 1 },
    { label: 'Sale', value: 2 },
    { label: 'Purchase Return', value: 3 },
    { label: 'Sale Return', value: 4 },
    { label: 'Credit Note', value: 5 },
    { label: 'Debit Note', value: 6 },
    { label: 'Journal', value: 0 },
    { label: 'Cash Entry', value: 7 } // Added Cash Entry
  ];
  selectedTypes: number[] = this.entryTypes.map(type => type.value); // Select all types by default
  startDate: Date;
  endDate: Date;
  filteredEntries: any[] = [];
  currentBalance: number = 0; // Initialize current balance
  openingBalance: number = 0; // Initialize opening balance
  // New properties for cursor-based pagination
  rowCursor: number | null = 0;
  hasNextPage: boolean = false;
  dbHasNextPage: boolean = false; // Variable to keep track of hasNextPage state from the database
  constructor(
    private journalService: JournalService,
    private financialYearService: FinancialYearService,
    private storageService: StorageService,
    private balanceService: BalanceService,
    private accountService: AccountService, // Add AccountService to the constructor
    private dbService: NgxIndexedDBService,
    private webSocketService: WebSocketService, // Inject WebSocket service
    public dialog: MatDialog,
    private datePipe: DatePipe, // Inject DatePipe
  ) { }

  ngOnInit(): void {
    this.getFinancialYear();
    this.fetchEntriesSubject.pipe(debounceTime(300)).subscribe(() => {
      this.fetchEntries();
    });
    this.subscribeToWebSocketEvents(); // Subscribe to WebSocket events
  }
  ngOnDestroy() {
    this.subscription.unsubscribe(); // Clean up the subscription
    this.webSocketService.close();
  }
  getFinancialYear(): void {
    const storedFinancialYear = this.financialYearService.getStoredFinancialYear();
    if (storedFinancialYear) {
      this.financialYear = storedFinancialYear;
      this.userId = this.storageService.getUser().id; // Ensure userId is initialized
      const [startYear, endYear] = this.financialYear.split('-').map(Number);
      this.startDate = new Date(startYear, 3, 1); // April 1st of start year
      this.endDate = new Date(endYear, 2, 31); // March 31st of end year
      this.fetchCurrentBalance();
      this.fetchOpeningBalance(); // Fetch opening balance once
      this.fetchEntries();
    }
  }

  dateFilter = (date: Date | null): boolean => {
    if (!date || !this.financialYear) {
      return false;
    }
    const [startYear, endYear] = this.financialYear.split('-').map(Number);
    const startDate = new Date(startYear, 3, 1); // April 1st of start year
    const endDate = new Date(endYear, 2, 31); // March 31st of end year
    return date >= startDate && date <= endDate;
  };

  fetchEntries(): void {
    const cacheKey = `${this.userId}-${this.financialYear}-${this.offset}`;
    console.log(cacheKey);
    if (!this.cacheKeys.includes(cacheKey)) {
      this.cacheKeys.push(cacheKey);
    }
    if (this.inMemoryCache.has(cacheKey)) {
      this.dayBookEntries = this.inMemoryCache.get(cacheKey) || []; // Ensure dayBookEntries is not undefined
      this.updatePaginationState(this.dayBookEntries.length >= this.pageSize);
      this.processRealTimeUpdate();
    } else {
      this.dbService.getByKey('dayBookEntries', cacheKey).subscribe((cachedData: any) => {
        console.log(cachedData);
        console.log(cacheKey);
        if (cachedData) {
          this.dayBookEntries = cachedData.entries || []; // Ensure dayBookEntries is not undefined
          this.addToMemoryCache(cacheKey, this.dayBookEntries);
          this.updatePaginationState(this.dayBookEntries.length >= this.pageSize);
          this.processRealTimeUpdate();
        } else {
          this.fetchCombinedEntries();
        }
      });
    }
  }

  fetchCombinedEntries(): void {
    this.journalService.getCombinedEntriesForDayBook(this.userId, this.financialYear, this.limit, this.rowCursor || 0 // Use rowCursor for pagination
    ).subscribe(data => {
      this.combinedEntries = data.entries;
      this.rowCursor = data.nextRowCursor; // Update rowCursor for the next batch  
      this.updatePaginationState(data.hasNextPage); // Update pagination state based on backend response
      this.processData();
    });
  }

  exportToPDF() {
    this.journalService.exportToPDF(this.userId, this.financialYear).subscribe((response: Blob) => {
      saveAs(response, `daybook_${this.userId}_${this.financialYear}.pdf`);
    }, error => {
      console.error('Error exporting PDF:', error);
    });
  }
  exportToExcel(){
    this.journalService.exportToExcel(this.userId, this.financialYear).subscribe((response: Blob) => {
      saveAs(response, `daybook_${this.userId}_${this.financialYear}.xlsx`);
    }, error => {
      console.error('Error exporting PDF:', error);
    });
  }

  updatePaginationState(hasMoreRecords: boolean): void {
    this.hasNextPage = hasMoreRecords;
    this.dbHasNextPage = hasMoreRecords; // Update dbHasNextPage with the value from the database
  }

  fetchOpeningBalance(): void {
    const userId = this.storageService.getUser().id;
    const financialYear = this.financialYear;

    this.accountService.getAccount(userId, financialYear, 'CASH').subscribe(account => {
      if (account) {
        this.openingBalance = account.debit_balance;
      }
    });
  }
  fetchCurrentBalance(): void {
    this.balanceService.getInitialBalance(this.userId, this.financialYear).subscribe(balance => {
      this.currentBalance = balance.amount;
    });
  }

  async processData(): Promise<void> {
    let totalCashCredit = 0;
    let totalJournalCredit = 0;
    let totalJournalDebit = 0;
    let totalCashDebit = 0;
    this.dayBookEntries = []; // Clear existing entries

    console.log(this.combinedEntries);

    // Process combinedEntries to create dayBookEntries
    for (const entry of this.combinedEntries) {
      const accountName = await this.getAccountName(entry.account_id);
      const cashCredit = entry.entry_type === 7 && entry.type ? entry.amount : 0;
      const cashDebit = entry.entry_type === 7 && !entry.type ? entry.amount : 0;
      const journalCredit = entry.entry_type >= 0 && entry.entry_type <= 6 && entry.type ? entry.amount : 0;
      const journalDebit = entry.entry_type >= 0 && entry.entry_type <= 6 && !entry.type ? entry.amount : 0;

      totalCashCredit += cashCredit;
      totalCashDebit += cashDebit;
      totalJournalCredit += journalCredit;
      totalJournalDebit += journalDebit;

      this.dayBookEntries.push({
        id: entry.entry_type === 7 ? entry.id : entry.entry_id, // Include id attribute based on entry_type
        date: entry.date,
        cashCredit,
        journalCredit,
        particular: accountName,
        account_id: entry.account_id,
        journalDebit,
        cashDebit,
        type: entry.entry_type
      });
    }

    console.log(this.dayBookEntries);

    // Cache the fetched data in both in-memory cache and IndexedDB
    const cacheKey = `${this.userId}-${this.financialYear}-${this.offset}`;
    this.addToMemoryCache(cacheKey, this.dayBookEntries);
    this.dbService.update('dayBookEntries', { key: cacheKey, entries: this.dayBookEntries }).subscribe();

    // Sort entries by date
    this.dayBookEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Group entries by date
    const groupedEntries = this.groupByDate(this.dayBookEntries);

    // Calculate totals and balance carry forward for each day
    this.groupedDayBookEntries = Object.keys(groupedEntries).map((date, index, array) => {
      const entries = groupedEntries[date];
      const totalCashCredit = entries.reduce((sum: number, entry: any) => sum + entry.cashCredit, 0);
      const totalJournalCredit = entries.reduce((sum: number, entry: any) => sum + entry.journalCredit, 0);
      const totalJournalDebit = entries.reduce((sum: number, entry: any) => sum + entry.journalDebit, 0);
      const totalCashDebit = entries.reduce((sum: number, entry: any) => sum + entry.cashDebit, 0);
      const balanceCarryForward = totalCashCredit - totalCashDebit;
      const journalBalanceCarryForward = totalJournalCredit - totalJournalDebit;

      // Add opening balance for the next day
      if (index < array.length - 1) {
        const nextDate = array[index + 1];
        groupedEntries[nextDate].unshift({
          date: nextDate,
          cashCredit: balanceCarryForward, // Corrected to cashCredit
          journalCredit: 0,
          particular: 'Opening Balance',
          journalDebit: 0,
          cashDebit: 0
        });
      }

      return {
        date,
        entries,
        totalCashCredit,
        totalJournalCredit,
        totalJournalDebit,
        totalCashDebit,
        balanceCarryForward,
        journalBalanceCarryForward
      };
    });

    // Apply initial filters
    this.applyFilters();
  }

  toggleType(type: any): void {
    const index = this.selectedTypes.indexOf(type.value);
    if (index >= 0) {
      this.selectedTypes.splice(index, 1);
    } else {
      this.selectedTypes.push(type.value);
    }
  }

  applyFilters(): void {
    this.filteredEntries = this.groupedDayBookEntries.map(day => {
      const dayDate = new Date(day.date);
      const isWithinDateRange = (!this.startDate || dayDate >= this.startDate) && (!this.endDate || dayDate <= this.endDate);
      const filteredEntries = day.entries.filter((entry: any) => this.selectedTypes.includes(entry.type));
      return {
        ...day,
        entries: isWithinDateRange ? [day.entries[0], ...filteredEntries] : []
      };
    }).filter(day => day.entries.length > 0);
  }

  addToMemoryCache(key: string, value: any[]): void {
    if (this.inMemoryCache.size >= this.maxCacheSize) {
      const firstKey = this.inMemoryCache.keys().next().value;
      console.log(firstKey);
      if (firstKey !== undefined) {
        this.inMemoryCache.delete(firstKey);
      }
    }
    console.log(this.inMemoryCache);
    this.inMemoryCache.set(key, value);
  }

  groupByDate(entries: any[]): any {
    return entries.reduce((grouped, entry) => {
      const date = entry.date.split('T')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(entry);
      return grouped;
    }, {});
  }

  async getAccountName(accountId: number): Promise<string> {
    const account = await this.accountService.getAccount(this.storageService.getUser().id, this.financialYear, undefined, accountId).toPromise();
    return account ? account.name : 'Unknown Account';
  }

  nextPage(): void {
    this.currentPage++;
    this.offset = (this.currentPage - 1) * this.limit;
    this.totalPages = Math.max(this.totalPages, this.currentPage);
    this.fetchEntriesSubject.next();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.offset = (this.currentPage - 1) * this.limit;
      this.hasNextPage = true; // Update hasNextPage to true when moving to the previous page
      this.fetchEntriesSubject.next();
    }
  }
  canMoveToNextPage(): boolean {
    return this.hasNextPage || this.dbHasNextPage;
  }

  subscribeToWebSocketEvents(): void {
    const currentUserId = this.storageService.getUser().id;
    const currentFinancialYear = this.financialYear;
    const entryTypes = ['entry', 'journal', 'cash'];
  
    entryTypes.forEach(type => {
      this.subscription.add(
        this.webSocketService.onEvent('INSERT').subscribe(async (data: any) => {
          if (data.entryType === type && data.user_id === currentUserId && data.financial_year === currentFinancialYear) {
            console.log("first");
            await this.handleInsertEvent(data.data, type);
          }
        })
      );
      this.subscription.add(
          this.webSocketService.onEvent('UPDATE').subscribe(async (data: any) => {
          if (data.entryType === type && data.user_id === currentUserId && data.financial_year === currentFinancialYear) {
            console.log("second");
            await this.handleUpdateEvent(data.data, type);
          }
        })
      );
      this.subscription.add(
        this.webSocketService.onEvent('DELETE').subscribe(async (data: any) => {
          if (data.entryType === type && data.user_id === currentUserId && data.financial_year === currentFinancialYear) {
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
        const journalCredit = item.type ? item.amount : 0;
        const journalDebit = item.type ? 0 : item.amount;

        newEntry = {
          id: journalEntry.type === 0 ? journalEntry.journal_id : data.entry.id,
          date: this.datePipe.transform(journalEntry.journal_date, 'yyyy-MM-dd', 'en-IN'),
          cashCredit: 0,
          journalCredit,
          particular: accountName,
          account_id: item.account_id,
          journalDebit,
          cashDebit: 0,
          type: journalEntry.type
        };

        await this.insertEntry(newEntry);
      }
    } else if (type === 'cash') {
      const entry = data.entry;
      const accountName = await this.getAccountName(entry.account_id);
      const cashCredit = entry.type ? entry.amount : 0;
      const cashDebit = entry.type ? 0 : entry.amount;
      this.currentBalance += cashCredit - cashDebit;

      newEntry = {
        id: entry.id,
        date: this.datePipe.transform(entry.entry_date, 'yyyy-MM-dd', 'en-IN'),
        cashCredit,
        journalCredit: 0,
        particular: accountName,
        journalDebit: 0,
        cashDebit,
        type: 7
      };

      await this.insertEntry(newEntry);
    }
  }

  async insertEntry(newEntry: any): Promise<void> {
    // Sequentially check if the new entry's date falls within the existing dates in IndexedDB
    const checkSequentially = async () => {
      for (const cacheKey of this.cacheKeys) {
        const cachedData: any = await this.dbService.getByKey('dayBookEntries', cacheKey).toPromise();
        if (cachedData) {
          console.log(cacheKey);
          console.log(cachedData);
          const existingEntries = cachedData.entries || [];
          const entryIndex = existingEntries.findIndex((entry: any) => entry.date > newEntry.date);
          const sameDateExists = existingEntries.some((entry: any) => entry.date === newEntry.date);
          console.log(entryIndex);
          if (entryIndex !== -1 || sameDateExists) {
            // Insert the new entry at the correct position in IndexedDB
            console.log(existingEntries);
  
            // Update IndexedDB and then update the in-memory cache sequentially
            await this.updateIndexDBAndCache(cacheKey, existingEntries, newEntry);
            return;
          }
        }
      }
  
      // If the new entry's date does not fall within any existing dates, insert it in the last cacheKey
      if (!this.hasNextPage) {
        const lastCacheKey = this.cacheKeys[this.cacheKeys.length - 1];
        const lastCachedData: any = await this.dbService.getByKey('dayBookEntries', lastCacheKey).toPromise();
        const lastExistingEntries = lastCachedData ? lastCachedData.entries || [] : [];
  
        // Check if the new entry's date should be inserted
        const index = lastExistingEntries.findIndex((entry :any) => entry.date > newEntry.date);
        if (index === -1) {
          lastExistingEntries.push(newEntry); 
          await this.dbService.update('dayBookEntries', { key: lastCacheKey, entries: lastExistingEntries }).toPromise();
          // Ensure the in-memory cache is updated after IndexedDB update
          if (this.inMemoryCache.has(lastCacheKey)) {
            this.addToMemoryCache(lastCacheKey, lastExistingEntries);
          }
        }
      }
    }; 
    await checkSequentially();
  }
  
  async updateCacheAndDB(newEntry: any): Promise<void> {
    const cacheKey = `${this.userId}-${this.financialYear}-${this.offset}`;
  
    // Update IndexedDB with the new entry
    const cachedData: any = await this.dbService.getByKey('dayBookEntries', cacheKey).toPromise();
    const existingEntries = cachedData ? cachedData.entries || [] : [];
    existingEntries.push(newEntry);
    existingEntries.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
    await this.dbService.update('dayBookEntries', { key: cacheKey, entries: existingEntries }).toPromise();
    // Ensure the in-memory cache is updated after IndexedDB update
    this.addToMemoryCache(cacheKey, existingEntries);
    this.processRealTimeUpdate();
  }
  
  async updateIndexDBAndCache(cacheKey: string, existingEntries: any[], newEntry: any): Promise<void> {
    existingEntries.push(newEntry);
    existingEntries.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
    await this.dbService.update('dayBookEntries', { key: cacheKey, entries: existingEntries }).toPromise();
    // Ensure the in-memory cache is updated after IndexedDB update
    if (this.inMemoryCache.has(cacheKey)) {
      this.addToMemoryCache(cacheKey, existingEntries);
    }
  
    // Update the in-memory dayBookEntries if the entry is on the current page
    const currentPageIndex = this.dayBookEntries.findIndex(entry => entry.date > newEntry.date);
    const sameDateExistsInMemory = this.dayBookEntries.some(entry => entry.date === newEntry.date);
    if (currentPageIndex !== -1) {
      this.dayBookEntries.splice(currentPageIndex, 0, newEntry);
      this.dayBookEntries = [...this.dayBookEntries];
      this.processRealTimeUpdate();
    }
    if(sameDateExistsInMemory){
      this.dayBookEntries.push(newEntry);
      this.processRealTimeUpdate();
    }
  }
  
  processRealTimeUpdate(): void {
    // Group entries by date
    const groupedEntries = this.groupByDate(this.dayBookEntries);

    // Calculate totals and balance carry forward for each day
    this.groupedDayBookEntries = Object.keys(groupedEntries).map((date, index, array) => {
      const entries = groupedEntries[date];
      const totalCashCredit = entries.reduce((sum: number, entry: any) => sum + entry.cashCredit, 0);
      const totalJournalCredit = entries.reduce((sum: number, entry: any) => sum + entry.journalCredit, 0);
      const totalJournalDebit = entries.reduce((sum: number, entry: any) => sum + entry.journalDebit, 0);
      const totalCashDebit = entries.reduce((sum: number, entry: any) => sum + entry.cashDebit, 0);
      const balanceCarryForward = totalCashCredit - totalCashDebit;
      const journalBalanceCarryForward = totalJournalCredit - totalJournalDebit;

      // Add opening balance for the next day
      if (index < array.length - 1) {
        const nextDate = array[index + 1];
        groupedEntries[nextDate].unshift({
          date: nextDate,
          cashCredit: balanceCarryForward, // Corrected to cashCredit
          journalCredit: 0,
          particular: 'Opening Balance',
          journalDebit: 0,
          cashDebit: 0
        });
      }

      return {
        date,
        entries,
        totalCashCredit,
        totalJournalCredit,
        totalJournalDebit,
        totalCashDebit,
        balanceCarryForward,
        journalBalanceCarryForward
      };
    });

    // Apply initial filters
    this.applyFilters();
  }
  async handleUpdateEvent(data: any, type: string): Promise<void> {
    if (type === 'entry' || type === 'journal') {
      const journalEntry = data.journalEntry || data;
      const updatedEntries = await Promise.all(journalEntry.items.map(async (item: any) => ({
        id: journalEntry.type === 0 ? journalEntry.journal_id : data.entry.id,
        date: this.datePipe.transform(journalEntry.journal_date, 'yyyy-MM-dd', 'en-IN'),
        cashCredit: 0,
        journalCredit: item.type ? item.amount : 0,
        particular: await this.getAccountName(item.account_id),
        account_id: item.account_id,
        journalDebit: item.type ? 0 : item.amount,
        cashDebit: 0,
        type: journalEntry.type
      })));
  
      await this.updateEntries(updatedEntries); // Ensure sequential update
    } else if (type === 'cash') {
      const entry = data.entry;
      const updatedEntry = {
        id: entry.id,
        date: this.datePipe.transform(entry.entry_date, 'yyyy-MM-dd', 'en-IN'),
        cashCredit: entry.type ? entry.amount : 0,
        journalCredit: 0,
        particular: await this.getAccountName(entry.account_id),
        journalDebit: 0,
        cashDebit: entry.type ? 0 : entry.amount,
        type: 7
      };
  
      await this.updateEntries([updatedEntry]); // Ensure sequential update
    }
  }
  
  async updateEntries(updatedEntries: any[]): Promise<void> {
    for (const cacheKey of this.cacheKeys) {
      const cachedData: any = await this.dbService.getByKey('dayBookEntries', cacheKey).toPromise();
      if (cachedData) {
        const existingEntries = cachedData.entries || [];
        const entryIndices = existingEntries.reduce((indices: number[], entry: any, index: number) => {
          if (entry.id === updatedEntries[0].id) {
            indices.push(index);
          }
          return indices;
        }, []);
  
        if (entryIndices.length >= updatedEntries.length) {
          for (let i = 0; i < updatedEntries.length; i++) {
            const entryIndex = entryIndices[i];
            const oldEntry = existingEntries[entryIndex];
            const oldCashCredit = oldEntry.cashCredit;
            const oldCashDebit = oldEntry.cashDebit;
            const newCashCredit = updatedEntries[i].cashCredit;
            const newCashDebit = updatedEntries[i].cashDebit;
  
            this.currentBalance += (newCashCredit - newCashDebit) - (oldCashCredit - oldCashDebit);
  
            existingEntries[entryIndex] = updatedEntries[i];
          }
  
          await this.dbService.update('dayBookEntries', { key: cacheKey, entries: existingEntries }).toPromise();
  
          // Ensure the in-memory cache is updated after IndexedDB update
          if (this.inMemoryCache.has(cacheKey)) {
            this.addToMemoryCache(cacheKey, existingEntries);
          }
  
          // Update the in-memory dayBookEntries if the entry is on the current page
          const currentPageIndices = this.dayBookEntries.reduce((indices: number[], entry: any, index: number) => {
            if (entry.id === updatedEntries[0].id) {
              indices.push(index);
            }
            return indices;
          }, []);
  
          if (currentPageIndices.length >= updatedEntries.length) {
            for (let i = 0; i < updatedEntries.length; i++) {
              const currentPageIndex = currentPageIndices[i];
              this.dayBookEntries[currentPageIndex] = updatedEntries[i];
            }
            this.dayBookEntries = [...this.dayBookEntries];
            this.processRealTimeUpdate();
          }
          break; // Move to the next cacheKey
        }
      }
    }
  }
  
  async handleDeleteEvent(data: any, type: string): Promise<void> {
    if (type === 'entry' || type === 'journal') {
        const id = type === 'entry' ? data.entry.id : data.id;
  
      // Check IndexedDB for existing record
      for (const cacheKey of this.cacheKeys) {
        const cachedData: any = await this.dbService.getByKey('dayBookEntries', cacheKey).toPromise();
        if (cachedData) {
          const existingEntries = cachedData.entries || [];
          const entryIndices = existingEntries.reduce((indices: number[], e: any, index: number) => {
            if (e.id === id) {
              indices.push(index);
            }
            return indices;
          }, []);
  
          if (entryIndices.length > 0) {
            const startIndex = entryIndices[0];
            const endIndex = entryIndices[entryIndices.length - 1];
            existingEntries.splice(startIndex, endIndex - startIndex + 1);
  
            await this.dbService.update('dayBookEntries', { key: cacheKey, entries: existingEntries }).toPromise();
  
            // Update the in-memory cache if it exists
            if (this.inMemoryCache.has(cacheKey)) {
              this.addToMemoryCache(cacheKey, existingEntries);
            }
  
            const filteredEntries = this.dayBookEntries.filter(e => e.id !== id);
            if (filteredEntries.length !== this.dayBookEntries.length) {
              this.dayBookEntries = filteredEntries;
              this.processRealTimeUpdate();
            }
          }
        }
      }
    } else if (type === 'cash') {
      const entry = data.entry;
  
      // Check IndexedDB for existing record
      for (const cacheKey of this.cacheKeys) {
        const cachedData: any = await this.dbService.getByKey('dayBookEntries', cacheKey).toPromise();
        if (cachedData) {
          const existingEntries = cachedData.entries || [];
          const entryIndex = existingEntries.findIndex((e: any) => e.id === entry.id);
          if (entryIndex !== -1) {
            const oldEntry = existingEntries[entryIndex];
            const oldCashCredit = oldEntry.type ? oldEntry.amount : 0;
            const oldCashDebit = oldEntry.type ? 0 : oldEntry.amount;
  
            this.currentBalance -= (oldCashCredit - oldCashDebit);
  
            existingEntries.splice(entryIndex, 1);
            await this.dbService.update('dayBookEntries', { key: cacheKey, entries: existingEntries }).toPromise();
  
            // Update the in-memory cache if it exists
            if (this.inMemoryCache.has(cacheKey)) {
              this.addToMemoryCache(cacheKey, existingEntries);
            }
  
            const itemIndex = this.dayBookEntries.findIndex(e => e.id === entry.id);
            if (itemIndex !== -1) {
              const oldEntry = this.dayBookEntries[itemIndex];
              const oldCashCredit = oldEntry.type ? oldEntry.amount : 0;
              const oldCashDebit = oldEntry.type ? 0 : oldEntry.amount;
  
              this.currentBalance -= (oldCashCredit - oldCashDebit);
  
              this.dayBookEntries.splice(itemIndex, 1);
              this.processRealTimeUpdate();
            }
          }
        }
      }
    }
  }  

  navigateToEditPage(entry: any) {
    switch (entry.type) {
      case 1:
        this.openAddEditEntryDialog(entry.id, 1);
        break;
      case 2:
        this.openAddEditEntryDialog(entry.id, 2);
        break;
      case 3:
        this.openAddEditEntryDialog(entry.id, 3);
        break;
      case 4:
        this.openAddEditEntryDialog(entry.id, 4);
        break;
      case 5:
        this.openAddEditEntryDialog(entry.id, 5);
        break;
      case 6:
        this.openAddEditEntryDialog(entry.id, 6);
        break;
      case 0:
        this.openEditJournalEntryDialog(entry.id);
        break;
      case 7:
        this.openEditCashBookDialog(entry.id, this.currentBalance);
        break;
      default:
        console.error('Unknown entry type:', entry.type);
    }
  }

  openAddEditEntryDialog(entryId: number, type: number): void {
    const dialogRef = this.dialog.open(AddEditEntryDialogComponent, {
      width: '1000px',
      data: { entryId, type, financialYear: this.financialYear, userId: this.userId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Handle the result from the dialog
        console.log('Dialog result:', result);
      }
    });
  }

  openEditJournalEntryDialog(journalId: number): void {
    console.log(journalId);
    const dialogRef = this.dialog.open(EditJournalEntryDialogComponent, {
      width: '800px',
      data: { journalId, financialYear: this.financialYear }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Handle the result from the dialog
        console.log('Dialog result:', result);
      }
    });
  }

  openEditCashBookDialog(entryId: number, currentBalance: number): void {
    const dialogRef = this.dialog.open(EditCashBookDialogComponent, {
      width: '800px',
      data: { entryId, currentBalance, financialYear: this.financialYear }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Handle the result from the dialog
        console.log('Dialog result:', result);
      }
    });
  }
}
