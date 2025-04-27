import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { JournalService } from '../../services/journal.service';
import { JournalEntry } from '../../models/journal-entry.interface';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { EditJournalEntryDialogComponent } from '../../dialogbox/edit-journal-entry-dialog/edit-journal-entry-dialog.component';
import { StorageService } from '../../services/storage.service';
import { AddJournalEntryDialogComponent } from '../../dialogbox/add-journal-entry-dialog/add-journal-entry-dialog.component';
import { FinancialYearService } from '../../services/financial-year.service';
import { AccountService } from '../../services/account.service';
import { ActivatedRoute } from '@angular/router';
import { WebSocketService } from '../../services/websocket.service'; // Import WebSocket service
import { Subscription } from 'rxjs'; // Import Subscription
import { GroupService } from '../../services/group.service';
import { CachedPage } from '../../models/cache-key.interface';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-journal-list',
  standalone: true,
  imports: [MatTableModule, MatToolbarModule, MatCardModule, CommonModule],
  templateUrl: './journal-list.component.html',
  styleUrls: ['./journal-list.component.css']
})
export class JournalListComponent implements OnInit, OnDestroy {
  private subscription: Subscription = new Subscription(); // Initialize the subscription
  journalEntries = new MatTableDataSource<JournalEntry>();
  displayedColumns: string[] = ['journal_date', 'user_name', 'actions'];
  nestedDisplayedColumns: string[] = ['account_name', 'group_name', 'debit_amount', 'credit_amount','narration'];
  expandedElement: JournalEntry | null;
  financialYear: string;
  accountId: number;
  groupId: number;
  accountMap: { [key: number]: string } = {};
  groupMap: { [key: number]: string } = {};
  cache = new Map<number, CachedPage>(); // Cache for pages
  currentPage = 1;
  pageSize = 400;
  totalPages = 0;
  hasMore = true;
  nextStartRow = 1;
  constructor(
    private journalService: JournalService,
    public dialog: MatDialog,
    private storageService: StorageService,
    private financialYearService: FinancialYearService,
    private accountService: AccountService,
    private groupService: GroupService,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar, // Inject MatSnackBar
    private webSocketService: WebSocketService // Inject WebSocket service
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.accountId = params['accountId'] || null;
      this.groupId = params['groupId'] || null;
      this.getFinancialYear();
    });
    this.subscribeToWebSocketEvents(); // Subscribe to WebSocket events
  }
  ngOnDestroy() {
    this.subscription.unsubscribe(); // Clean up the subscription
    this.webSocketService.close();
  }
  getFinancialYear() {
    const storedFinancialYear = this.financialYearService.getStoredFinancialYear();
    if (storedFinancialYear) {
      this.financialYear = storedFinancialYear;
      this.fetchAccountAndGroup().then(() => {
        console.log("test1");
        this.fetchJournalEntries();
      });
    }
  }
  async fetchAccountAndGroup(): Promise<void> {
    await Promise.all([this.fetchSuppliers(), this.fetchGroupList()]);
  }

  fetchSuppliers(): Promise<void> {
    return new Promise((resolve) => {
      const userId = this.storageService.getUser().id;
      this.accountService.getAccountsByUserIdAndFinancialYear(userId, this.financialYear).subscribe((accounts: any[]) => {
        accounts.forEach(account => {
          this.accountMap[account.id] = account.name;
        });
        resolve();
      });
    });
  }
  fetchGroupList(): Promise<void> {
    return new Promise((resolve) => {
      const userId = this.storageService.getUser().id;
      this.groupService.getGroupsByUserIdAndFinancialYear(userId, this.financialYear).subscribe((groups: any[]) => {
        groups.forEach(group => {
          this.groupMap[group.id] = group.name;
        });
        resolve();
      });
    });
  }

  updateJournalEntiresWithgroupAndAccountMap(data: any[]): void {
    const userId = this.storageService.getUser().id;
    const username = this.storageService.getUser().username;
    data.forEach(entry => {
      entry.user_id = userId;
      entry.user_name = username;
      entry.financial_year = this.financialYear,
        entry.items.forEach((item: any) => {
          item.account_name = this.accountMap[item.account_id];
          item.group_name = this.groupMap[item.group_id];
          item.debit_amount = item.type ? 0 : item.amount,
          item.credit_amount = item.type ? item.amount : 0
          item.showFullNarration = false // Initialize showFullNarration to false
        });
    });
    this.journalEntries.data = data.sort((a, b) => new Date(a.journal_date).getTime() - new Date(b.journal_date).getTime());
  }

  fetchJournalEntries(): void {
    const userId = this.storageService.getUser().id;
    if (this.groupId) {
      this.journalService.getJournalEntriesByGroup(this.groupId, userId, this.financialYear, this.nextStartRow, this.pageSize).subscribe(data => {
        this.updateJournalEntiresWithgroupAndAccountMap(data.journalEntries);
        this.hasMore = data.hasMore;
        this.nextStartRow = data.nextStartRow;
        this.cache.set(this.currentPage, {
          dataRange: this.getDataRange(data.journalEntries), // Calculate data range based on entries
          data: data.journalEntries
        });
      });
    } else if (this.accountId) {
      this.journalService.getJournalEntriesByAccount(this.accountId, userId, this.financialYear, this.nextStartRow, this.pageSize).subscribe(data => {
        this.updateJournalEntiresWithgroupAndAccountMap(data.journalEntries);
        this.hasMore = data.hasMore;
        this.nextStartRow = data.nextStartRow;
        this.cache.set(this.currentPage, {
          dataRange: this.getDataRange(data.journalEntries), // Calculate data range based on entries
          data: data.journalEntries
        });
      });
    } else {
      this.journalService.getJournalEntriesByUserIdAndFinancialYear(userId, this.financialYear, this.nextStartRow, this.pageSize).subscribe(data => {
        this.updateJournalEntiresWithgroupAndAccountMap(data.journalEntries);
        this.hasMore = data.hasMore;
        this.nextStartRow = data.nextStartRow;
        this.cache.set(this.currentPage, {
          dataRange: this.getDataRange(data.journalEntries), // Calculate data range based on entries
          data: data.journalEntries
        });
      });
    }
  }

  onNextPage() {
    const userId = this.storageService.getUser().id;
    if (this.cache.has(this.currentPage + 1) || this.hasMore) {
      this.currentPage += 1;
      this.fetchJournalEntriesWithPagination(userId);
    }
  }

  onPreviousPage() {
    const userId = this.storageService.getUser().id;
    if (this.currentPage > 1) {
      this.currentPage -= 1;
      this.fetchJournalEntriesWithPagination(userId);
    }
  }

  fetchJournalEntriesWithPagination(userId: number): void {
    if (this.cache.has(this.currentPage)) {
      // Use cached data if available
      this.journalEntries.data = this.cache.get(this.currentPage)?.data || []; // Provide default empty array if data is not present
    } else {
      // Fetch from the backend if not in cache
      if (this.groupId) {
        this.journalService.getJournalEntriesByGroup(this.groupId, userId, this.financialYear, this.nextStartRow, this.pageSize).subscribe(data => {
          this.updateJournalEntiresWithgroupAndAccountMap(data.journalEntries);
          this.hasMore = data.hasMore;
          this.nextStartRow = data.nextStartRow;
          this.cache.set(this.currentPage, {
            dataRange: this.getDataRange(data.journalEntries), // Calculate data range based on entries
            data: data.journalEntries
          }); // Cache the fetched data
        });
      } else if (this.accountId) {
        this.journalService.getJournalEntriesByAccount(this.accountId, userId, this.financialYear, this.nextStartRow, this.pageSize).subscribe(data => {
          this.updateJournalEntiresWithgroupAndAccountMap(data.journalEntries);
          this.hasMore = data.hasMore;
          this.nextStartRow = data.nextStartRow;
          this.cache.set(this.currentPage, {
            dataRange: this.getDataRange(data.journalEntries), // Calculate data range based on entries
            data: data.journalEntries
          }); // Cache the fetched data
        });
      } else {
        this.journalService.getJournalEntriesByUserIdAndFinancialYear(userId, this.financialYear, this.nextStartRow, this.pageSize).subscribe(data => {
          this.updateJournalEntiresWithgroupAndAccountMap(data.journalEntries);
          this.hasMore = data.hasMore;
          this.nextStartRow = data.nextStartRow;
          this.cache.set(this.currentPage, {
            dataRange: this.getDataRange(data.journalEntries), // Calculate data range based on entries
            data: data.journalEntries
          }); // Cache the fetched data
          console.log(this.cache);
        });
      }
    }
  }
  getDataRange(entries: JournalEntry[]): { start: number, end: number } {
    if (entries.length === 0) {
      return { start: 0, end: 0 };
    }

    const start = new Date(entries[0].journal_date).getTime();
    const end = new Date(entries[entries.length - 1].journal_date).getTime();
    return { start, end };
  }

  addJournalEntry(): void {
    const dialogRef = this.dialog.open(AddJournalEntryDialogComponent, {
      width: '1000px',
      data: this.financialYear
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.journalService.addJournalEntry(result).subscribe({
          next: () => {
            this.snackBar.open(`Journal entries addition is successfully.`,'Close',{ duration: 3000 });
          }
        });
      }
    });
  }

  editJournalEntry(entry: JournalEntry): void {
    const dialogRef = this.dialog.open(EditJournalEntryDialogComponent, {
      width: '1000px',
      data: entry
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.journalService.updateJournalEntry(result).subscribe({
          next: () => {
            this.snackBar.open(`Journal entries updation is successfully.`,'Close',{ duration: 3000 });
          }
        });
      }
    });
  }

  deleteJournalEntry(id: number): void {
    this.journalService.deleteJournalEntry(id).subscribe({
      next: () => {
        this.snackBar.open(`Journal entries deletion is successfully.`,'Close',{ duration: 3000 });
      },
      error: (error) => {
        this.snackBar.open(error.message, 'Close', { duration: 10000 });
      },
    });
  }

  subscribeToWebSocketEvents(): void {
    console.log("hello");
    const username = this.storageService.getUser().username;
    const currentUserId = this.storageService.getUser().id;
    const currentFinancialYear = this.financialYear;

    const handleEvent = (data: any, action: 'INSERT' | 'UPDATE' | 'DELETE') => {
      console.log(`Handling event: ${action}`, data);
      if ((data.entryType === 'journal' || data.entryType === 'entry') && data.user_id === currentUserId && data.financial_year === currentFinancialYear) {
        switch (action) {
          case 'INSERT':
            handleInsert(data);
            break;
          case 'UPDATE':
            handleUpdate(data);
            break;
          case 'DELETE':
            handleDelete(data);
            break;
        }
      }
    };

    this.subscription.add(this.webSocketService.onEvent('INSERT').subscribe((data: any) => handleEvent(data, 'INSERT')));
    this.subscription.add(this.webSocketService.onEvent('UPDATE').subscribe((data: any) => handleEvent(data, 'UPDATE')));
    this.subscription.add(this.webSocketService.onEvent('DELETE').subscribe((data: any) => handleEvent(data, 'DELETE')));


    const updateCache = (page: CachedPage, action: 'INSERT' | 'UPDATE' | 'DELETE', entry: JournalEntry) => {
      switch (action) {
        case 'INSERT':
          page.data.push(entry);
          page.data.sort((a, b) => new Date(a.journal_date).getTime() - new Date(b.journal_date).getTime());
          if (this.hasMore) {
            this.nextStartRow += entry.items?.length || 0;
          }
          break;
        case 'UPDATE':
          const updateIndex = page.data.findIndex(e => e.id === entry.id);
          if (updateIndex !== -1) {
            if (this.hasMore) {
              this.nextStartRow -= page.data[updateIndex].items?.length || 0;
              this.nextStartRow += entry.items?.length || 0;
            }
            page.data[updateIndex] = { ...page.data[updateIndex], ...entry };
          }
          break;
        case 'DELETE':
          const deleteIndex = page.data.findIndex(e => e.id === entry.id);
          if (deleteIndex !== -1) {
            page.data.splice(deleteIndex, 1);
            if (this.hasMore) {
              this.nextStartRow -= entry.items?.length || 0;
            }
          }
          break;
      }
    };

    const handleInsert = (data: any) => {
      // Extract items based on the entry type
      const items = data.entryType === 'journal' ? data.data.items : data.data.journalEntry.items;

      // Filter items based on accountId or groupId
      const filteredItems = items.filter((item: any) => {
        if (this.accountId && Number(item.account_id) === Number(this.accountId)) return true;
        if (this.groupId && Number(item.group_id) === Number(this.groupId)) return true;
        if (!this.accountId && !this.groupId) return true;
        return false;
      });

      // Update items with additional properties
      filteredItems.forEach((item: any) => {
        item.account_name = this.accountMap[item.account_id];
        item.group_name = this.groupMap[item.group_id];
        item.debit_amount = item.type ? 0 : item.amount;
        item.credit_amount = item.type ? item.amount : 0;
      });

      // Create the converted object for insertion with filtered items
      const convertedObjectInsert = {
        ...(data.entryType === 'journal' ? data.data : data.data.journalEntry),
        items: filteredItems,
        user_id: currentUserId,
        user_name: username,
        financial_year: currentFinancialYear,
      };

      console.log('Processing INSERT event');

      // Update cache if the date range fits within existing pages
      for (const [pageNumber, page] of this.cache.entries()) {
        console.log(pageNumber);
        console.log(page);
        if ((
          new Date(convertedObjectInsert.journal_date).getTime() >= page.dataRange.start &&
          new Date(convertedObjectInsert.journal_date).getTime() <= page.dataRange.end) || (page.dataRange.start > new Date(convertedObjectInsert.journal_date).getTime() && !this.cache.has(pageNumber-1))
        ) {
          updateCache(page, 'INSERT', convertedObjectInsert);
          if (Number(pageNumber) === this.currentPage) {  // Convert pageNumber to a number before comparison
            this.journalEntries.data = page.data;
          }
          return;
        }
      }

      // Handle new page creation for future-dated records
      if (!this.hasMore) {
        const lastPage = Math.max(...Array.from(this.cache.keys()));
        const lastPageEntry = this.cache.get(lastPage);
        if (
          lastPageEntry &&
          new Date(convertedObjectInsert.journal_date).getTime() > lastPageEntry.dataRange.end
        ) {
          this.cache.set(lastPage + 1, {
            data: [convertedObjectInsert],
            dataRange: {
              start: new Date(convertedObjectInsert.journal_date).getTime(),
              end: new Date(convertedObjectInsert.journal_date).getTime()
            }
          });
        }
      }

      // If the entry doesn't fit in any existing pages, handle new page creation logic here
      console.log('Inserted data:', this.journalEntries.data);
    };

    const handleUpdate = (data: any) => {
      console.log('Processing UPDATE event');
      const items = data.entryType === 'journal' ? data.data.items : data.data.journalEntry.items;
      // Filter items based on accountId or groupId
      const filteredItems = items.filter((item: any) => {
        if (this.accountId && Number(item.account_id) === Number(this.accountId)) return true;
        if (this.groupId && Number(item.group_id) === Number(this.groupId)) return true;
        if (!this.accountId && !this.groupId) return true;
        return false;
      });
      // Update items with additional properties
      filteredItems.forEach((item: any) => {
        item.account_name = this.accountMap[item.account_id];
        item.group_name = this.groupMap[item.group_id];
        item.debit_amount = item.type ? 0 : item.amount;
        item.credit_amount = item.type ? item.amount : 0;
      });
      const convertedObjectUpdate = {
        ...(data.entryType === 'journal' ? data.data : data.data.journalEntry),
        items: filteredItems,
        user_id: currentUserId,
        user_name: username,
        financial_year: currentFinancialYear,
      };

      for (const [pageNumber, page] of this.cache.entries()) {
        if (new Date(convertedObjectUpdate.journal_date).getTime() >= page.dataRange.start
          && new Date(convertedObjectUpdate.journal_date).getTime() <= page.dataRange.end && page.data.some((entry: any) => entry.id === convertedObjectUpdate.id)) {
          updateCache(page, 'UPDATE', convertedObjectUpdate);
          if (Number(pageNumber) === this.currentPage) {  // Convert pageNumber to a number before comparison
            this.journalEntries.data = page.data;
          }
          return;
        }
      }

      // If the entry doesn't fit in any existing pages, handle new page creation logic here
      console.log('Updated data:', this.journalEntries.data);
    };

    const handleDelete = (data: any) => {
      console.log('Processing DELETE event');
      const entryId = data.entryType === 'journal' ? data.data.id : data.data.group.journal_id;
      const journal_date = data.entryType === 'journal' ? data.data.journal_date : data.data.group.journal_date;

      for (const [pageNumber, page] of this.cache.entries()) {
        if (new Date(journal_date).getTime() >= page.dataRange.start
          && new Date(journal_date).getTime() <= page.dataRange.end && page.data.some((entry: any) => entry.id === entryId)) {
          updateCache(page, 'DELETE', { id: entryId } as JournalEntry);
          if (Number(pageNumber) === this.currentPage) {  // Convert pageNumber to a number before comparison
            this.journalEntries.data = page.data;
          }
          return;
        }
      }

      // If the entry doesn't fit in any existing pages, handle new page creation logic here
      console.log('Deleted data:', this.journalEntries.data);
    };
  }

}