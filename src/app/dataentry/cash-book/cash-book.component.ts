import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { AddCashBookDialogComponent } from '../../dialogbox/add-cash-book-dialog/add-cash-book-dialog.component';
import { EditCashBookDialogComponent } from '../../dialogbox/edit-cash-book-dialog/edit-cash-book-dialog.component';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CashEntry } from '../../models/cash-entry.interface';
import { FinancialYearService } from '../../services/financial-year.service';
import { StorageService } from '../../services/storage.service';
import { CashEntriesService } from '../../services/cash-entries.service';
import { AccountService } from '../../services/account.service';
import { forkJoin } from 'rxjs';

// import { WebSocketService } from '../../services/websocket.service'; // Import WebSocket service
// import { Subscription } from 'rxjs'; // Import Subscription

@Component({
  selector: 'app-cash-book',
  standalone: true,
  imports: [MatIconModule, MatCardModule, MatTableModule, CommonModule, MatToolbarModule],
  templateUrl: './cash-book.component.html',
  styleUrls: ['./cash-book.component.css']
})
export class CashBookComponent implements OnInit, OnDestroy {
  // private subscription: Subscription = new Subscription(); // Initialize the subscription
  transactions: MatTableDataSource<CashEntry>;
  displayedColumns: string[] = ['cash_credit', 'cash_entry_date', 'account_name', 'narration_description', 'cash_debit', 'balance', 'actions'];
  dateDisplayedColumns: string[] = ['cash_credit', 'account_name', 'narration_description', 'cash_debit', 'balance', 'actions'];
  currentBalance: number = 0;
  financialYear: string;
  groupedTransactions: { date: Date, transactions: CashEntry[], runningBalance: number }[] = [];
  openingBalance: number = 0;

  constructor(
    public dialog: MatDialog,
    private financialYearService: FinancialYearService,
    private storageService: StorageService,
    private cashEntriesService: CashEntriesService,
    // private webSocketService: WebSocketService, // Inject WebSocket service
    private accountService: AccountService,
  ) {
    this.transactions = new MatTableDataSource<CashEntry>([]);
  }

  ngOnInit(): void {
    this.getFinancialYear();
    // this.subscribeToWebSocketEvents(); // Subscribe to WebSocket events
  }

  ngOnDestroy() {
    // this.subscription.unsubscribe(); // Clean up the subscription
    // this.webSocketService.close();
  }

  getFinancialYear() {
    const storedFinancialYear = this.financialYearService.getStoredFinancialYear();
    if (storedFinancialYear) {
      this.financialYear = storedFinancialYear;
      this.fetchCashBook();
    }
  }

  fetchCashBook(): void {
    this.cashEntriesService.getCashEntriesByUserIdAndFinancialYear(this.storageService.getUser().id, this.financialYear).subscribe((data: CashEntry[]) => {
      this.transactions.data = data.map(entry => ({
        ...entry,
        cash_entry_date: new Date(entry.cash_entry_date),
        cash_debit: entry.type ? 0 : entry.amount,
        cash_credit: entry.type ? entry.amount : 0,
        balance: 0 // Initial balance, will be recalculated
      }));
      this.groupedTransactions = this.groupEntriesByDate(this.transactions.data);
      this.recalculateBalances();
    });
  }

  subscribeToWebSocketEvents(): void {
    console.log("hello");

    const currentUserId = this.storageService.getUser().id;
    const currentFinancialYear = this.financialYear;

    const handleEvent = (data: any, action: 'BULK_INSERT' | 'UPDATE' | 'DELETE') => {
      console.log(`Handling event: ${action}`, data);

      if (data.entryType === 'cash' && data.user_id === currentUserId && data.financial_year === currentFinancialYear) {
        switch (action) {
          case 'BULK_INSERT':
            this.handleBulkCashInsert(data);
            break;
          case 'UPDATE':
            this.handleCashUpdate(data);
            break;
          case 'DELETE':
            this.handleCashDelete(data);
            break;
        }
      }
    };

    // this.subscription.add(this.webSocketService.onEvent('INSERT').subscribe((data: any) => handleEvent(data, 'INSERT')));
    // this.subscription.add(this.webSocketService.onEvent('UPDATE').subscribe((data: any) => handleEvent(data, 'UPDATE')));
    // this.subscription.add(this.webSocketService.onEvent('DELETE').subscribe((data: any) => handleEvent(data, 'DELETE')));
  }

  handleCashInsert(data: any): void {
    this.accountService.getAccount(data.user_id, data.financial_year, undefined, data.data.account_id).subscribe(account => {
      const accountName = account ? account.name : 'Unknown Account';
      const formattedEntry: CashEntry = {
        ...data.data,
        cash_entry_date: new Date(data.data.cash_date),
        narration_description: data.data.narration,
        cash_debit: data.data.type ? 0 : data.data.amount,
        cash_credit: data.data.type ? data.data.amount : 0,
        balance: 0,
        account_name: accountName
      };
      console.log('Processing INSERT event');

      this.transactions.data = [...this.transactions.data, formattedEntry];
      this.groupedTransactions = this.groupEntriesByDate(this.transactions.data);
      this.recalculateBalances();
      console.log('Inserted data:', this.transactions.data);
      console.log('Grouped transactions:', this.groupedTransactions);

    });
  }


  handleBulkCashInsert(data: any): void {

    const uniqueAccountIds: number[] = Array.from(
      new Set(data.data.map((entry: any) => entry.account_id))
    );

    const accountRequests = uniqueAccountIds.map(accountId =>
      this.accountService.getAccount(data.user_id, data.financial_year, undefined, accountId)
    );

    forkJoin(accountRequests).subscribe(accountResponses => {
      const accountMap = new Map<number, string>();
      accountResponses.forEach(account => {
        if (account) {
          accountMap.set(account.id, account.name);
        }
      });

      const formattedEntries: CashEntry[] = data.data.map((entry: any) => ({
        ...entry,
        cash_entry_date: new Date(data.cash_date),
        narration_description: entry.narration,
        cash_debit: entry.type ? 0 : entry.amount,
        cash_credit: entry.type ? entry.amount : 0,
        balance: 0,
        account_name: accountMap.get(entry.account_id) || 'Unknown Account'
      }));

      console.log('Processing BULK_INSERT event');

      this.transactions.data = [...this.transactions.data, ...formattedEntries];
      this.groupedTransactions = this.groupEntriesByDate(this.transactions.data);
      this.recalculateBalances();

      console.log('Inserted bulk entries:', formattedEntries);
      console.log('Grouped transactions:', this.groupedTransactions);
    });
  }


  handleCashUpdate(data: any): void {
    this.accountService.getAccount(data.user_id, data.financial_year, undefined, data.data.account_id).subscribe(account => {
      const accountName = account ? account.name : 'Unknown Account';
      const formattedEntry: CashEntry = {
        ...data.data,
        cash_entry_date: new Date(data.data.cash_date),
        narration_description: data.data.narration,
        cash_debit: data.data.type ? 0 : data.data.amount,
        cash_credit: data.data.type ? data.data.amount : 0,
        balance: 0,
        account_name: accountName
      };

      const updateIndex = this.transactions.data.findIndex(entry => entry.unique_entry_id === formattedEntry.unique_entry_id);
      if (updateIndex !== -1) {
        this.transactions.data[updateIndex] = {
          ...this.transactions.data[updateIndex],
          ...formattedEntry,
        };
        this.transactions.data = [...this.transactions.data];
      }
      console.log('Updated data:', this.transactions.data);

      this.groupedTransactions = this.groupEntriesByDate(this.transactions.data);
      this.recalculateBalances();
      console.log('Grouped transactions:', this.groupedTransactions);

    });
  }

  handleCashDelete(data: any): void {
    console.log('Processing DELETE event');
    const deleteIndex = this.transactions.data.findIndex(entry => entry.unique_entry_id === data.data.unique_entry_id);
    if (deleteIndex !== -1) {
      this.transactions.data.splice(deleteIndex, 1);
      this.transactions.data = [...this.transactions.data]; // Ensure the array is updated
      console.log('Deleted data:', this.transactions.data); // Add this line
    }
    this.groupedTransactions = this.groupEntriesByDate(this.transactions.data);
    this.recalculateBalances();
    console.log('Grouped transactions:', this.groupedTransactions);
  }


  groupEntriesByDate(entries: CashEntry[]): { date: Date, transactions: CashEntry[], runningBalance: number }[] {
    // Sort entries by date in ascending order
    entries.sort((a, b) => new Date(a.cash_entry_date).getTime() - new Date(b.cash_entry_date).getTime());

    const groupedEntries: { [key: string]: CashEntry[] } = {};

    entries.forEach(entry => {
      const date = new Date(entry.cash_entry_date).toDateString();
      if (!groupedEntries[date]) {
        groupedEntries[date] = [];
      }
      groupedEntries[date].push(entry);
    });

    const result: { date: Date, transactions: CashEntry[], runningBalance: number }[] = [];
    for (const date in groupedEntries) {
      const dateEntries = groupedEntries[date];
      const runningBalance = dateEntries.reduce((acc, entry) => acc + (entry.cash_credit - entry.cash_debit), 0);
      result.push({ date: new Date(date), transactions: dateEntries, runningBalance });
    }

    return result;
  }

  addCashEntry(): void {
    const dialogRef = this.dialog.open(AddCashBookDialogComponent, {
      width: '1000px',
      data: { currentBalance: this.currentBalance, financialYear: this.financialYear }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.handleBulkCashInsert(result);
      }
    });
  }

  editCashEntry(transaction: CashEntry): void {
    const dialogRef = this.dialog.open(EditCashBookDialogComponent, {
      width: '900px',
      data: { entry: transaction, currentBalance: this.currentBalance, financialYear: this.financialYear }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.handleCashUpdate(result);
      }
    });
  }

  deleteTransaction(transaction: CashEntry): void {
    if (transaction.unique_entry_id) {
      this.cashEntriesService.deleteCashEntry(transaction.unique_entry_id).subscribe((result) => {
        if (result) {
          this.handleCashDelete(result);
        }
      });
    }
  }

  recalculateBalances(): void {
    this.currentBalance = 0;
    this.openingBalance = 0;

    // Fetch the opening balance from the account list where name is "CASH"
    this.accountService.getAccountsByUserIdAndFinancialYear(this.storageService.getUser().id, this.financialYear).subscribe(accounts => {
      const cashAccount = accounts.find(account => account.name === 'CASH');
      if (cashAccount) {
        this.openingBalance = parseFloat((cashAccount.debit_balance - cashAccount.credit_balance).toFixed(2));

      }

      this.groupedTransactions.forEach((dateGroup, groupIndex) => {
        dateGroup.runningBalance = 0;
        dateGroup.transactions.forEach((transaction, index) => {
          const cashDebit = parseFloat(transaction.cash_debit.toString()) || 0;
          const cashCredit = parseFloat(transaction.cash_credit.toString()) || 0;

          if (index === 0 && groupIndex === 0) {
            // Add the opening balance to the first dated record's cash credit
            this.currentBalance += this.openingBalance;
          }

          if (cashDebit) {
            this.currentBalance -= cashDebit;
          } else if (cashCredit) {
            this.currentBalance += cashCredit;
          }

          transaction.balance = this.currentBalance;
          dateGroup.runningBalance = this.currentBalance;
        });
      });
    });
  }
}
