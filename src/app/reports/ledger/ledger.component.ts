import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { interval, Subscription } from 'rxjs';
import { LedgerService } from '../../services/ledger.service';
import { WebSocketService } from '../../services/websocket.service';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AccountService } from '../../services/account.service';
import { StorageService } from '../../services/storage.service';
import { FinancialYearService } from '../../services/financial-year.service';
import { saveAs } from 'file-saver';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { SupplierFilterPipe } from '../../pipe/supplier-filter.pipe';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-ledger',
  standalone: true,
  imports: [MatInputModule,ReactiveFormsModule,ScrollingModule, CommonModule, MatIconModule,MatAutocompleteModule, SupplierFilterPipe],
  templateUrl: './ledger.component.html',
  styleUrls: ['./ledger.component.css']
})
export class LedgerComponent implements OnInit, OnDestroy, AfterViewInit  {
  @ViewChild(CdkVirtualScrollViewport) viewport: CdkVirtualScrollViewport;
  ledger: any[] = [];
  selectedAccountId: number;
  rowCursor: number = 0;
  limit: number = 100;
  loading: boolean = false;
  hasMoreRecords: boolean = true;
  refreshNeeded: boolean = false;
  pollingSubscription: Subscription;
  lastUpdatedTimestamp: Date;
  financialYear: string;
  accountList: any[] = [];
  userId: number;
  previousBalance: number=0;
  searchName: FormControl = new FormControl(''); // FormControl for input field
  constructor(
    private ledgerService: LedgerService,
    private webSocketService: WebSocketService,
    private accountService: AccountService,
    private storageService: StorageService,
    private financialYearService: FinancialYearService
  ) {}

  ngOnInit(): void {
    console.log('ngOnInit called');
    this.getFinancialYear();
    this.userId = this.storageService.getUser().id;
    this.fetchAccountList();
    this.setupWebSocketListeners();
    this.startPolling();
  }

  ngAfterViewInit(): void {
    console.log('ngAfterViewInit called');
    this.viewport.elementScrolled().subscribe(() => this.onScroll());
  }

  getFinancialYear() {
    console.log('getFinancialYear called');
    const storedFinancialYear = this.financialYearService.getStoredFinancialYear();
    if (storedFinancialYear) {
      this.financialYear = storedFinancialYear;
    }
  }

  ngOnDestroy(): void {
    console.log('ngOnDestroy called');
    this.stopPolling();
    this.webSocketService.close();
  }

  fetchAccountList(): void {
    console.log('fetchAccountList called');
    this.accountService.getAccountsByUserIdAndFinancialYear(this.userId, this.financialYear).subscribe((accounts: any[]) => {
      this.accountList = accounts.map(account => ({
        id: account.id,
        name: account.name
      }));
    });
  }

  onAccountSelectionChange(event: any): void {
    console.log('onAccountSelectionChange called');
    this.hasMoreRecords = true;
    this.selectedAccountId = event.id;
    this.searchName.patchValue(event.name);
    this.previousBalance=0;
    this.refreshLedger();
  }

  fetchLedger(): void {
    console.log('fetchLedger called');
    console.log(this.loading);
    console.log(this.selectedAccountId);
    console.log(this.hasMoreRecords);

    if (this.loading || !this.selectedAccountId || !this.hasMoreRecords) return;
    this.loading = true;

    this.ledgerService.getLedger(this.selectedAccountId, this.rowCursor, this.limit, this.userId, this.financialYear,this.previousBalance).subscribe(
      (data) => {
        console.log('fetchLedger response received');
        this.ledger = [...this.ledger, ...data.ledger];
        this.rowCursor = data.nextRowCursor;
        this.loading = false;
        this.previousBalance=data.lastBalance;
        this.updateLastUpdatedTimestamp();

        // Update hasMoreRecords property
        this.hasMoreRecords = data.hasMoreRecords;
      },
      (error) => {
        console.error('Error fetching ledger data:', error);
        this.loading = false;
      }
    );
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

  setupWebSocketListeners(): void {
    console.log('setupWebSocketListeners called');
    this.webSocketService.onEvent('INSERT').subscribe((data) => {
      this.handleNewData(data);
    });

    this.webSocketService.onEvent('UPDATE').subscribe((data) => {
      this.handleUpdatedData(data);
    });

    this.webSocketService.onEvent('DELETE').subscribe((data) => {
      this.handleDeletedData(data);
    });
  }

  startPolling(): void {
    console.log('startPolling called');
    this.pollingSubscription = interval(600000).subscribe(() => {
      this.checkForNewData();
    });
  }

  stopPolling(): void {
    console.log('stopPolling called');
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  checkForNewData(): void {
    console.log('checkForNewData called');
    if (this.ledger.length === 0) return;

    const startTime = this.ledger[0].date;
    const endTime = this.ledger[this.ledger.length - 1].date;
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    this.ledgerService.getUpdatedLedger(this.selectedAccountId, startTime, endTime, tenMinutesAgo, this.userId, this.financialYear).subscribe(
      (data) => {
        console.log('checkForNewData response received');
        if (data.length > 0) {
          this.processUpdatedData(data);
          this.updateLastUpdatedTimestamp();
        }
      },
      (error) => {
        console.error('Error checking for new data:', error);
      }
    );
  }

  updateLastUpdatedTimestamp(): void {
    console.log('updateLastUpdatedTimestamp called');
    if (this.ledger.length > 0) {
      this.lastUpdatedTimestamp = new Date(Math.max(...this.ledger.map(entry => new Date(entry.updatedAt).getTime())));
    }
  }

  processUpdatedData(data: any[]): void {
    console.log('processUpdatedData called');
    data.forEach(updatedEntry => {
      const existingEntryIndex = this.ledger.findIndex(entry => entry.id === updatedEntry.id);
      if (existingEntryIndex === -1) {
        // Insert the new data in the correct position
        this.ledger.push(updatedEntry);
        this.ledger.sort((a, b) => a.date.localeCompare(b.date));
      } else {
        // Update the existing entry
        this.ledger[existingEntryIndex] = updatedEntry;
      }
    });

    // Recalculate the running balance
    let balance = 0;
    this.ledger.forEach(entry => {
      if (entry.type) { // Assuming type is boolean
        balance += parseFloat(entry.credit);
      } else {
        balance -= parseFloat(entry.debit);
      }
      entry.balance = balance.toFixed(2);
    });
  }

  handleNewData(data: any): void {
    console.log('handleNewData called');
    const newDate = new Date(data.date);
    const lastDate = new Date(this.ledger[this.ledger.length - 1].date);

    if (newDate <= lastDate) {
      // Insert the new data in the correct position
      this.ledger.push(data);
      this.ledger.sort((a, b) => a.date.localeCompare(b.date));

      // Recalculate the running balance
      let balance = 0;
      this.ledger.forEach(entry => {
        if (entry.type) { // Assuming type is boolean
          balance += parseFloat(entry.credit);
        } else {
          balance -= parseFloat(entry.debit);
        }
        entry.balance = balance.toFixed(2);
      });

      // Adjust the row cursor to account for the new record
      this.rowCursor += 1;
    } else {
      // Mark the ledger as needing a refresh
      this.refreshNeeded = true;
    }
  }

  handleUpdatedData(data: any): void {
    console.log('handleUpdatedData called');
    const index = this.ledger.findIndex(entry => entry.id === data.id);
    if (index !== -1) {
      this.ledger[index] = data;
      this.ledger.sort((a, b) => a.date.localeCompare(b.date));

      // Recalculate the running balance
      let balance = 0;
      this.ledger.forEach(entry => {
        if (entry.type) { // Assuming type is boolean
          balance += parseFloat(entry.credit);
        } else {
        balance -= parseFloat(entry.debit);
      }
      entry.balance = balance.toFixed(2);
    });
  } else {
    this.refreshNeeded = true;
  }
}

handleDeletedData(data: any): void {
  console.log('handleDeletedData called');
  const index = this.ledger.findIndex(entry => entry.id === data.id);
  if (index !== -1) {
    this.ledger.splice(index, 1);
    this.ledger.sort((a, b) => a.date.localeCompare(b.date));

    // Recalculate the running balance
    let balance = 0;
    this.ledger.forEach(entry => {
      if (entry.type) { // Assuming type is boolean
        balance += parseFloat(entry.credit);
      } else {
        balance -= parseFloat(entry.debit);
      }
      entry.balance = balance.toFixed(2);
    });

    // Adjust the row cursor to account for the deleted record
    this.rowCursor = Math.max(0, this.rowCursor - 1);
  } else {
    this.refreshNeeded = true;
  }
}

onScroll(): void {
  console.log('onScroll called');
  if (!this.selectedAccountId || !this.hasMoreRecords) return;
  const end = this.viewport.getRenderedRange().end;
  console.log(end);
  const total = this.viewport.getDataLength();
  console.log(total);
  if (end >= total * 0.75) {
    this.fetchLedger();
  }
}

refreshLedger(): void {
  console.log('refreshLedger called');
  this.ledger = [];
  this.rowCursor = 0;
  this.fetchLedger();
  this.refreshNeeded = false;
}
}
