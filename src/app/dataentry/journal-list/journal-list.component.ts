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
import { ActivatedRoute } from '@angular/router';
import { WebSocketService } from '../../services/websocket.service'; // Import WebSocket service
import { Subscription } from 'rxjs'; // Import Subscription

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
  accountName: string | null = null;
  groupName: string | null = null;

  constructor(
    private journalService: JournalService,
    public dialog: MatDialog,
    private storageService: StorageService,
    private financialYearService: FinancialYearService,
    private route: ActivatedRoute,
    private webSocketService: WebSocketService // Inject WebSocket service
  ) { }

  ngOnInit(): void {
    this.getFinancialYear();
    this.route.queryParams.subscribe(params => {
      this.accountName = params['accountName'] || null;
      this.groupName = params['groupName'] || null;
      this.fetchJournalEntries();
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
      this.fetchJournalEntries();
    }
  }

  fetchJournalEntries(): void {
    const userId = this.storageService.getUser().id;
    if (this.groupName) {
      this.journalService.getJournalEntriesByGroup(this.groupName, userId, this.financialYear).subscribe((data: JournalEntry[]) => {
        this.journalEntries.data = data.sort((a, b) => new Date(a.journal_date).getTime() - new Date(b.journal_date).getTime());
      });
    } else if (this.accountName) {
      this.journalService.getJournalEntriesByAccount(this.accountName, userId, this.financialYear).subscribe((data: JournalEntry[]) => {
        this.journalEntries.data = data.sort((a, b) => new Date(a.journal_date).getTime() - new Date(b.journal_date).getTime());
      });
    } else {
      this.journalService.getJournalEntriesByUserIdAndFinancialYear(userId, this.financialYear).subscribe((data: JournalEntry[]) => {
        this.journalEntries.data = data.sort((a, b) => new Date(a.journal_date).getTime() - new Date(b.journal_date).getTime());
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
    const currentUserId = this.storageService.getUser().id;
    const currentFinancialYear = this.financialYear;

    const handleEvent = (data: any, action: 'INSERT' | 'UPDATE' | 'DELETE') => {
      console.log(`Handling event: ${action}`, data);
      if (data.entryType === 'journal' && data.user_id === currentUserId && data.financial_year === currentFinancialYear) {
        switch (action) {
          case 'INSERT':
            console.log('Processing INSERT event');
            this.journalEntries.data = [...this.journalEntries.data, data.data];
            console.log('Inserted data:', this.journalEntries.data);
            break;
          case 'UPDATE':
            console.log('Processing UPDATE event');
            const updateIndex = this.journalEntries.data.findIndex(entry => entry.id === data.data.id);
            if (updateIndex !== -1) {
              this.journalEntries.data[updateIndex] = {
                ...this.journalEntries.data[updateIndex],
                ...data.data,
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