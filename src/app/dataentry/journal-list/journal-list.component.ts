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
  displayedColumns: string[] = ['journal_date', 'journal_description', 'user_name', 'actions'];
  nestedDisplayedColumns: string[] = ['account_name', 'group_name', 'debit_amount', 'credit_amount'];
  expandedElement: JournalEntry | null;
  financialYear: string;
  accountId: number;
  groupId: number;
  accountMap: { [key: number]: string } = {};
  groupMap: { [key: number]: string } = {};

  constructor(
    private journalService: JournalService,
    public dialog: MatDialog,
    private storageService: StorageService,
    private financialYearService: FinancialYearService,
    private accountService: AccountService,
    private groupService: GroupService,
    private route: ActivatedRoute,
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
      entry.financial_year =  this.financialYear,
      entry.items.forEach((item:any) => {
        item.account_name = this.accountMap[item.account_id];
        item.group_name = this.groupMap[item.group_id];
        item.debit_amount =  item.type ? 0 : item.amount,
        item.credit_amount =  item.type ? item.amount : 0
      });
    });
    this.journalEntries.data = data.sort((a, b) => new Date(a.journal_date).getTime() - new Date(b.journal_date).getTime());
  }

  fetchJournalEntries(): void {
    const userId = this.storageService.getUser().id;
    if (this.groupId) {
      this.journalService.getJournalEntriesByGroup(this.groupId, userId, this.financialYear).subscribe((data: any[]) => {
        this.updateJournalEntiresWithgroupAndAccountMap(data);
      });
    } else if (this.accountId) {
      this.journalService.getJournalEntriesByAccount(this.accountId, userId, this.financialYear).subscribe((data: any[]) => {
        this.updateJournalEntiresWithgroupAndAccountMap(data);
      });
    } else {
      this.journalService.getJournalEntriesByUserIdAndFinancialYear(userId, this.financialYear).subscribe((data: any[]) => {
        this.updateJournalEntiresWithgroupAndAccountMap(data);
      });
    }
  }
  addJournalEntry(): void {
    const dialogRef = this.dialog.open(AddJournalEntryDialogComponent, {
      width: '800px',
      data: this.financialYear
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.journalService.addJournalEntry(result).subscribe();
      }
    });
  }

  editJournalEntry(entry: JournalEntry): void {
    const dialogRef = this.dialog.open(EditJournalEntryDialogComponent, {
      width: '800px',
      data: entry
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.journalService.updateJournalEntry(result).subscribe();
      }
    });
  }

  deleteJournalEntry(id: number): void {
    this.journalService.deleteJournalEntry(id).subscribe();
  }

  subscribeToWebSocketEvents(): void {
    console.log("hello");
    const username = this.storageService.getUser().username;
    const currentUserId = this.storageService.getUser().id;
    const currentFinancialYear = this.financialYear;

    const handleEvent = (data: any, action: 'INSERT' | 'UPDATE' | 'DELETE') => {
      console.log(`Handling event: ${action}`, data);
      if (data.entryType === 'journal' || data.entryType === 'entry' && data.user_id === currentUserId && data.financial_year === currentFinancialYear) {
        switch (action) {
          case 'INSERT':
            const items = data.entryType === 'journal' ? data.data.items : data.data.journalEntry.items;
            items.forEach((item: any) => {
              item.account_name = this.accountMap[item.account_id];
              item.group_name = this.groupMap[item.group_id];
              item.debit_amount = item.type ? 0 : item.amount;
              item.credit_amount = item.type ? item.amount : 0;
            }); 
            const convertedObjectInsert = {
              ...(data.entryType === 'journal' ? data.data : data.data.journalEntry),
              user_id: currentUserId,
              user_name: username,
              financial_year: currentFinancialYear,
            };
            console.log('Processing INSERT event');
            this.journalEntries.data = [...this.journalEntries.data, convertedObjectInsert];
            console.log('Inserted data:', this.journalEntries.data);
            break;
          case 'UPDATE':
            console.log('Processing UPDATE event');
            const updateIndex = this.journalEntries.data.findIndex(entry => entry.id === data.data.id);
            if (updateIndex !== -1) {
              const items = data.entryType === 'journal' ? data.data.items : data.data.journalEntry.items;
              items.forEach((item:any) => {
                item.account_name = this.accountMap[item.account_id];
                item.group_name = this.groupMap[item.group_id];
                item.debit_amount =  item.type ? 0 : item.amount,
                item.credit_amount =  item.type ? item.amount : 0
            });
              const convertedObjectUpdate = {
                ...(data.entryType === 'journal' ? data.data : data.data.journalEntry),
                user_id: currentUserId,
                user_name: username,
                financial_year:currentFinancialYear,
              };
              this.journalEntries.data[updateIndex] = {
                ...this.journalEntries.data[updateIndex],
                ...convertedObjectUpdate,
              };
              this.journalEntries.data = [...this.journalEntries.data];
              console.log('Updated data:', this.journalEntries.data);
            }
            break;
          case 'DELETE':
            console.log('Processing DELETE event');
            console.log(data.data.id);
            const deleteIndex = this.journalEntries.data.findIndex(entry => entry.id === data.data.id);
            console.log(deleteIndex);
            if (deleteIndex !== -1) {
              this.journalEntries.data.splice(deleteIndex, 1);
              this.journalEntries.data = [...this.journalEntries.data];
            }
            break;
        }
      }
    };

    this.subscription.add(this.webSocketService.onEvent('INSERT').subscribe((data: any) => handleEvent(data, 'INSERT')));
    this.subscription.add(this.webSocketService.onEvent('UPDATE').subscribe((data: any) => handleEvent(data, 'UPDATE')));
    this.subscription.add(this.webSocketService.onEvent('DELETE').subscribe((data: any) => handleEvent(data, 'DELETE')));
  }

}