import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CashEntriesService } from '../../services/cash-entries.service';
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
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { WebSocketService } from '../../services/websocket.service'; // Import WebSocket service
import { BalanceService } from '../../services/balance.service';
import { MatDialog } from '@angular/material/dialog';
import { EditCashBookDialogComponent } from '../../dialogbox/edit-cash-book-dialog/edit-cash-book-dialog.component';


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
    RouterModule,
    MatIconModule,
    FormsModule
  ],
  templateUrl: './daybook.component.html',
  styleUrls: ['./daybook.component.css']
})
export class DayBookComponent implements OnInit {
  cashEntries: any[] = [];
  journalEntries: any[] = [];
  dayBookEntries: any[] = []; // Initialize as an empty array
  groupedDayBookEntries: any[] = [];
  userId: number;
  financialYear: string;
  limit: number = 50; // Align limit with pageSize
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
  nextCashCursorDate: string | null = null;
  nextCashCursorId: number | null = null;
  nextJournalCursorDate: string | null = null;
  nextJournalCursorId: number | null = null;

  constructor(
    private cashEntriesService: CashEntriesService,
    private journalService: JournalService,
    private financialYearService: FinancialYearService,
    private storageService: StorageService,
    private balanceService: BalanceService,
    private accountService: AccountService, // Add AccountService to the constructor
    private dbService: NgxIndexedDBService,
    private webSocketService: WebSocketService, // Inject WebSocket service
    private router: Router,
    public dialog: MatDialog

  ) { }

  ngOnInit(): void {
    this.getFinancialYear();
    this.fetchEntriesSubject.pipe(debounceTime(300)).subscribe(() => {
      this.fetchEntries();
    });
    this.subscribeToWebSocketEvents(); // Subscribe to WebSocket events
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
    if (!this.cacheKeys.includes(cacheKey)) {
      this.cacheKeys.push(cacheKey);
    }
    if (this.inMemoryCache.has(cacheKey)) {
      this.dayBookEntries = this.inMemoryCache.get(cacheKey) || []; // Ensure dayBookEntries is not undefined
      this.processData();
    } else {
      this.dbService.getByKey('dayBookEntries', cacheKey).subscribe((cachedData: any) => {
        if (cachedData) {
          this.dayBookEntries = cachedData.entries || []; // Ensure dayBookEntries is not undefined
          this.addToMemoryCache(cacheKey, this.dayBookEntries);
          this.processData();
        } else {
          this.fetchCashEntries();
          this.fetchJournalEntries();
        }
      });
    }
  }

  fetchCashEntries(): void {
    this.cashEntriesService.getCashEntriesForDayBook(this.userId, this.financialYear, this.limit, this.nextCashCursorDate || undefined, this.nextCashCursorId || undefined).subscribe(data => {
      this.cashEntries = data.entries;
      this.nextCashCursorDate = data.nextCursorDate;
      this.nextCashCursorId = data.nextCursorId;
      this.checkDataFetchCompletion();
    });
  }

  fetchJournalEntries(): void {
    this.journalService.getJournalEntriesForDayBook(this.userId, this.financialYear, this.limit, this.nextJournalCursorDate || undefined, this.nextJournalCursorId || undefined).subscribe(data => {
      this.journalEntries = data.entries;
      this.nextJournalCursorDate = data.nextCursorDate;
      this.nextJournalCursorId = data.nextCursorId;
      this.checkDataFetchCompletion();
    });
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

  checkDataFetchCompletion(): void {
    this.dataFetchCounter++;
    if (this.dataFetchCounter === 2) {
      this.processData();
      this.dataFetchCounter = 0; // Reset dataFetchCounter after processing data
    }
  }

  async processData(): Promise<void> {
    let totalCashCredit = 0;
    let totalJournalCredit = 0;
    let totalJournalDebit = 0;
    let totalCashDebit = 0;

    // Process cashEntries and journalItems to create dayBookEntries
    for (const entry of this.cashEntries) {
      const accountName = await this.getAccountName(entry.account_id);
      const cashCredit = entry.type ? entry.amount : 0;
      const cashDebit = entry.type ? 0 : entry.amount;

      totalCashCredit += cashCredit;
      totalCashDebit += cashDebit;

      this.dayBookEntries.push({
        id: entry.id, // Include id attribute
        date: entry.cash_entry_date,
        cashCredit,
        journalCredit: 0,
        particular: accountName,
        journalDebit: 0,
        cashDebit,
        type: 7 // Mark as Cash Entry
      });
    }

    for (const journalEntry of this.journalEntries) {
      for (const item of journalEntry.items) {
        const accountName = await this.getAccountName(item.account_id);
        const journalCredit = item.type ? item.amount : 0;
        const journalDebit = item.type ? 0 : item.amount;

        totalJournalCredit += journalCredit;
        totalJournalDebit += journalDebit;

        this.dayBookEntries.push({
          id: journalEntry.type === 0 ? journalEntry.journal_id : journalEntry.entry_id, // Include id attribute based on type
          date: journalEntry.journal_date,
          cashCredit: 0,
          journalCredit,
          particular: accountName,
          journalDebit,
          cashDebit: 0,
          type: journalEntry.type
        });
      }
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
      if (firstKey !== undefined) {
        this.inMemoryCache.delete(firstKey);
      }
    }
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

  // Pagination methods
  get paginatedEntries(): any[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.groupedDayBookEntries.slice(startIndex, endIndex);
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
      this.fetchEntriesSubject.next();
    }
  }

  subscribeToWebSocketEvents(): void {
    const currentUserId = this.storageService.getUser().id;
    const currentFinancialYear = this.financialYear;
    const entryTypes = ['entry', 'journal', 'cash'];

    entryTypes.forEach(type => {
      this.webSocketService.onEvent('INSERT').subscribe((data: any) => {
        if (data.entryType === type && data.user_id === currentUserId && data.financial_year === currentFinancialYear) {
          this.handleInsertEvent(data.data, type);
        }
      });

      this.webSocketService.onEvent('UPDATE').subscribe((data: any) => {
        if (data.entryType === type && data.user_id === currentUserId && data.financial_year === currentFinancialYear) {
          this.handleUpdateEvent(data.data, type);
        }
      });

      this.webSocketService.onEvent('DELETE').subscribe((data: any) => {
        if (data.entryType === type && data.user_id === currentUserId && data.financial_year === currentFinancialYear) {
          this.handleDeleteEvent(data.data, type);
        }
      });
    });
  }

  handleInsertEvent(data: any, type: string): void {
    let newEntry: any;

    if (type === 'entry' || type === 'journal') {
      const journalEntry = data.journalEntry || data;
      journalEntry.items.forEach((item: any) => {
        const journalCredit = item.type ? item.amount : 0;
        const journalDebit = item.type ? 0 : item.amount;

        newEntry = {
          id: journalEntry.type === 0 ? journalEntry.journal_id : journalEntry.entry_id,
          date: journalEntry.journal_date,
          cashCredit: 0,
          journalCredit,
          particular: item.account_name,
          journalDebit,
          cashDebit: 0,
          type: journalEntry.type
        };

        this.insertEntry(newEntry);
      });
    } else if (type === 'cash') {
      const entry = data.entry;
      const accountName = this.getAccountName(entry.account_id);
      const cashCredit = entry.type ? entry.amount : 0;
      const cashDebit = entry.type ? 0 : entry.amount;
      this.currentBalance += cashCredit - cashDebit;

      newEntry = {
        id: entry.id,
        date: entry.entry_date,
        cashCredit,
        journalCredit: 0,
        particular: accountName,
        journalDebit: 0,
        cashDebit,
        type: 7
      };

      this.insertEntry(newEntry);
    }

  }

  insertEntry(newEntry: any): void {
    // Check if the new entry's date falls within the existing dates in IndexedDB
    const checkPromises = this.cacheKeys.map(cacheKey => {
      return this.dbService.getByKey('dayBookEntries', cacheKey).toPromise().then((cachedData: any) => {
        if (cachedData) {
          const existingEntries = cachedData.entries || [];
          const entryIndex = existingEntries.findIndex((entry: any) => new Date(entry.date).getTime() > new Date(newEntry.date).getTime());
          if (entryIndex !== -1) {
            // Insert the new entry at the correct position in IndexedDB
            existingEntries.splice(entryIndex, 0, newEntry);
            this.dbService.update('dayBookEntries', { key: cacheKey, entries: existingEntries }).subscribe();

            // Update the in-memory cache if it exists
            if (this.inMemoryCache.has(cacheKey)) {
              this.addToMemoryCache(cacheKey, existingEntries);
            }

            // Update the in-memory dayBookEntries if the entry is on the current page
            const currentPageIndex = this.dayBookEntries.findIndex(entry => new Date(entry.date).getTime() > new Date(newEntry.date).getTime());
            if (currentPageIndex !== -1) {
              this.dayBookEntries.splice(currentPageIndex, 0, newEntry);
              this.updateCacheAndDB(newEntry);
              this.processData();
            }
            return true;
          }
        }
        return false;
      });
    });

    Promise.all(checkPromises).then(results => {
      // If the new entry's date does not fall within any existing dates, insert it in the current set of records
      if (!results.includes(true)) {
        // Insert the new entry at the correct position based on the sorting criteria
        const index = this.dayBookEntries.findIndex(entry => new Date(entry.date).getTime() > new Date(newEntry.date).getTime());
        if (index === -1) {
          if (this.dayBookEntries.length < 100) {
            this.dayBookEntries.push(newEntry);
            // Update IndexedDB and in-memory cache
            this.updateCacheAndDB(newEntry);
            this.processData();
          }
        }
      }
    });
  }

  updateCacheAndDB(newEntry: any): void {
    const cacheKey = `${this.userId}-${this.financialYear}-${this.offset}`;
    this.addToMemoryCache(cacheKey, this.dayBookEntries);

    // Update IndexedDB with the new entry
    this.dbService.getByKey('dayBookEntries', cacheKey).subscribe((cachedData: any) => {
      if (cachedData) {
        const existingEntries = cachedData.entries || [];
        existingEntries.push(newEntry);
        existingEntries.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
        this.dbService.update('dayBookEntries', { key: cacheKey, entries: existingEntries }).subscribe();
      } else {
        this.dbService.update('dayBookEntries', { key: cacheKey, entries: [newEntry] }).subscribe();
      }
    });
  }

  handleUpdateEvent(data: any, type: string): void {
    let updatedEntry: any;
  
    if (type === 'entry' || type === 'journal') {
      const journalEntry = data.journalEntry || data;
      journalEntry.items.forEach((item: any) => {
        // Check IndexedDB for existing record
        this.cacheKeys.map(cacheKey => {
          return this.dbService.getByKey('dayBookEntries', cacheKey).toPromise().then((cachedData: any) => {
            if (cachedData) {
              const existingEntries = cachedData.entries || [];
              const entryIndex = existingEntries.findIndex((e: any) => e.id === item.id);
              if (entryIndex !== -1) {
                const accountName = this.getAccountName(item.account_id);
                const journalCredit = item.type ? item.amount : 0;
                const journalDebit = item.type ? 0 : item.amount;
  
                updatedEntry = {
                  ...existingEntries[entryIndex],
                  date: journalEntry.journal_date,
                  journalCredit,
                  particular: accountName,
                  journalDebit,
                  type: journalEntry.type
                };
  
                existingEntries[entryIndex] = updatedEntry;
                this.dbService.update('dayBookEntries', { key: cacheKey, entries: existingEntries }).subscribe();
  
                // Update the in-memory cache if it exists
                if (this.inMemoryCache.has(cacheKey)) {
                  this.addToMemoryCache(cacheKey, existingEntries);
                }
  
                // Update the in-memory dayBookEntries if the entry is on the current page
                const currentPageIndex = this.dayBookEntries.findIndex(e => e.id === item.id);
                if (currentPageIndex !== -1) {
                  this.dayBookEntries[currentPageIndex] = updatedEntry;
                  this.updateEntry(currentPageIndex, updatedEntry);
                  this.processData();
                }
  
                return true;
              }
            }
            return false;
          });
        });
      });
    } else if (type === 'cash') {
      const entry = data.entry;
      const accountName = this.getAccountName(entry.account_id);
      const newCashCredit = entry.type ? entry.amount : 0;
      const newCashDebit = entry.type ? 0 : entry.amount;
  
      // Check IndexedDB for existing record
      this.cacheKeys.map(cacheKey => {
        return this.dbService.getByKey('dayBookEntries', cacheKey).toPromise().then((cachedData: any) => {
          if (cachedData) {
            const existingEntries = cachedData.entries || [];
            const entryIndex = existingEntries.findIndex((e: any) => e.id === entry.id);
            if (entryIndex !== -1) {
              const oldEntry = existingEntries[entryIndex];
              const oldCashCredit = oldEntry.type ? oldEntry.amount : 0;
              const oldCashDebit = oldEntry.type ? 0 : oldEntry.amount;
  
              this.currentBalance += (newCashCredit - newCashDebit) - (oldCashCredit - oldCashDebit);
  
              updatedEntry = {
                ...oldEntry,
                date: entry.entry_date,
                cashCredit: newCashCredit,
                particular: accountName,
                cashDebit: newCashDebit,
                type: 7
              };
  
              existingEntries[entryIndex] = updatedEntry;
              this.dbService.update('dayBookEntries', { key: cacheKey, entries: existingEntries }).subscribe();
  
              // Update the in-memory cache if it exists
              if (this.inMemoryCache.has(cacheKey)) {
                this.addToMemoryCache(cacheKey, existingEntries);
              }
  
              // Update the in-memory dayBookEntries if the entry is on the current page
              const currentPageIndex = this.dayBookEntries.findIndex(e => e.id === entry.id);
              if (currentPageIndex !== -1) {
                this.dayBookEntries[currentPageIndex] = updatedEntry;
                this.updateEntry(currentPageIndex, updatedEntry);
                this.processData();
              }
  
              return true;
            }
          }
          return false;
        });
      });
    }
  }

  updateEntry(index: number, updatedEntry: any): void {
    // Update the entry in the in-memory cache
    this.dayBookEntries[index] = updatedEntry;

    // Update IndexedDB with the updated entry
    const cacheKey = `${this.userId}-${this.financialYear}-${this.offset}`;
    this.dbService.getByKey('dayBookEntries', cacheKey).subscribe((cachedData: any) => {
      if (cachedData) {
        const existingEntries = cachedData.entries || [];
        const entryIndex = existingEntries.findIndex((e: any) => e.id === updatedEntry.id);
        if (entryIndex !== -1) {
          existingEntries[entryIndex] = updatedEntry;
          this.dbService.update('dayBookEntries', { key: cacheKey, entries: existingEntries }).subscribe();

          // Update the in-memory cache if it exists
          if (this.inMemoryCache.has(cacheKey)) {
            this.addToMemoryCache(cacheKey, existingEntries);
          }
        }
      }
    });
    this.processData();
  }


  handleDeleteEvent(data: any, type: string): void {
    if (type === 'entry' || type === 'journal') {
      const journalEntry = data.journalEntry || data;
  
      // Check IndexedDB for existing record
      this.cacheKeys.map(cacheKey => {
        return this.dbService.getByKey('dayBookEntries', cacheKey).toPromise().then((cachedData: any) => {
          if (cachedData) {
            const existingEntries = cachedData.entries || [];
            const entryIndex = existingEntries.findIndex((e: any) => e.id === journalEntry.id);
            if (entryIndex !== -1) {
              existingEntries.splice(entryIndex, 1);
              this.dbService.update('dayBookEntries', { key: cacheKey, entries: existingEntries }).subscribe();
  
              // Update the in-memory cache if it exists
              if (this.inMemoryCache.has(cacheKey)) {
                this.addToMemoryCache(cacheKey, existingEntries);
              }
  
              const initialLength = this.dayBookEntries.length;
              this.dayBookEntries = this.dayBookEntries.filter(entry => entry.id !== journalEntry.id);
              this.journalEntries = this.journalEntries.filter(entry => entry.journal_id !== journalEntry.id);
              if (this.dayBookEntries.length < initialLength) {
                this.processData();
              }
  
              return true;
            }
          }
          return false;
        });
      });
    } else if (type === 'cash') {
      const entry = data.entry;
  
      // Check IndexedDB for existing record
      this.cacheKeys.map(cacheKey => {
        return this.dbService.getByKey('dayBookEntries', cacheKey).toPromise().then((cachedData: any) => {
          if (cachedData) {
            const existingEntries = cachedData.entries || [];
            const entryIndex = existingEntries.findIndex((e: any) => e.id === entry.id);
            if (entryIndex !== -1) {
              const oldEntry = existingEntries[entryIndex];
              const oldCashCredit = oldEntry.type ? oldEntry.amount : 0;
              const oldCashDebit = oldEntry.type ? 0 : oldEntry.amount;
  
              this.currentBalance -= (oldCashCredit - oldCashDebit);
  
              existingEntries.splice(entryIndex, 1);
              this.dbService.update('dayBookEntries', { key: cacheKey, entries: existingEntries }).subscribe();
  
              // Update the in-memory cache if it exists
              if (this.inMemoryCache.has(cacheKey)) {
                this.addToMemoryCache(cacheKey, existingEntries);
              }
  
              const initialLength = this.dayBookEntries.length;
              const itemIndex = this.dayBookEntries.findIndex(e => e.id === entry.id);
              if (itemIndex !== -1) {
                const oldEntry = this.dayBookEntries[itemIndex];
                const oldCashCredit = oldEntry.type ? oldEntry.amount : 0;
                const oldCashDebit = oldEntry.type ? 0 : oldEntry.amount;
  
                this.currentBalance -= (oldCashCredit - oldCashDebit);
  
                this.dayBookEntries.splice(itemIndex, 1);
              }
  
              this.cashEntries = this.cashEntries.filter(e => e.id !== entry.id);
              if (this.dayBookEntries.length < initialLength) {
                this.processData();
              }
  
              return true;
            }
          }
          return false;
        });
      });
    }
  }

  navigateToEditPage(entry: any) {
    switch (entry.type) {
      case 1:
        this.router.navigate(['/purchase-entry/edit', entry.id]);
        break;
      case 2:
        this.router.navigate(['/sale-entry/edit', entry.id]);
        break;
      case 3:
        this.router.navigate(['/purchase-return/edit', entry.id]);
        break;
      case 4:
        this.router.navigate(['/sale-return/edit', entry.id]);
        break;
      case 5:
        this.router.navigate(['/credit-note/edit', entry.id]);
        break;
      case 6:
        this.router.navigate(['/debit-note/edit', entry.id]);
        break;
      case 0:
        this.router.navigate(['/journal-entry/edit', entry.id]);
        break;
      case 7:
        this.openEditCashBookDialog(entry.id, this.currentBalance);
        break;
      default:
        console.error('Unknown entry type:', entry.type);
    }
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
