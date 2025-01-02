import { Component, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-cash-book',
  standalone: true,
  imports: [MatIconModule, MatCardModule, MatTableModule, CommonModule, MatToolbarModule],
  templateUrl: './cash-book.component.html',
  styleUrls: ['./cash-book.component.css']
})
export class CashBookComponent implements OnInit {
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
    private accountService: AccountService,
  ) {
    this.transactions = new MatTableDataSource<CashEntry>([]);
  }

  ngOnInit(): void {
    this.getFinancialYear();
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
      width: '800px',
      data: { currentBalance: this.currentBalance, financialYear: this.financialYear }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log(result);
        this.addTransaction(result);
      }
    });
  }

  editCashEntry(transaction: CashEntry): void {
    const dialogRef = this.dialog.open(EditCashBookDialogComponent, {
      width: '800px',
      data: { entry: transaction, currentBalance: this.currentBalance, financialYear: this.financialYear }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateTransaction(result);
      }
    });
  }

  addTransaction(transaction: CashEntry): void {
    console.log(transaction);
    const newEntry: CashEntry = {
      cash_entry_date: transaction.cash_entry_date,
      account_id: transaction.account_id,
      account_name: transaction.account_name,
      narration_description: transaction.narration_description,
      type: transaction.cash_debit > 0 ? false : true,
      cash_debit: transaction.cash_debit,
      cash_credit: transaction.cash_credit,
      amount: transaction.cash_debit > 0 ? transaction.cash_debit : transaction.cash_credit,
      balance: 0, // Initial balance, will be recalculated
      user_id: this.storageService.getUser().id,
      financial_year: this.financialYear,
    };

    this.cashEntriesService.addCashEntry(newEntry).subscribe((data: CashEntry) => {
      transaction.id = data.id;
      this.transactions.data = [...this.transactions.data, transaction];
      this.groupedTransactions = this.groupEntriesByDate(this.transactions.data);
      this.recalculateBalances();
    });
  }

  updateTransaction(updatedTransaction: CashEntry): void {
    const updatedEntry = {
      id: updatedTransaction.id!,
      cash_entry_date: updatedTransaction.cash_entry_date,
      account_id: updatedTransaction.account_id,
      account_name: updatedTransaction.account_name,
      narration_description: updatedTransaction.narration_description,
      type: updatedTransaction.cash_debit > 0 ? false : true,
      cash_debit: updatedTransaction.cash_debit,
      cash_credit: updatedTransaction.cash_credit,
      amount: updatedTransaction.cash_debit > 0 ? updatedTransaction.cash_debit : updatedTransaction.cash_credit,
      balance: 0, // Initial balance, will be recalculated
      user_id: this.storageService.getUser().id,
      financial_year: this.financialYear
    };

    this.cashEntriesService.updateCashEntry(updatedEntry.id, updatedEntry).subscribe(() => {
      const index = this.transactions.data.findIndex(entry => entry.id === updatedEntry.id);
      if (index !== -1) {
        this.transactions.data[index] = {
          ...this.transactions.data[index],
          ...updatedTransaction,
        };
        this.transactions.data = [...this.transactions.data];
        this.groupedTransactions = this.groupEntriesByDate(this.transactions.data);
        this.recalculateBalances(); // Recalculate balances after updating a transaction
      }
    });
  }

  deleteTransaction(transaction: CashEntry): void {
    if (transaction.id) {
      this.cashEntriesService.deleteCashEntry(transaction.id).subscribe(() => {
        const index = this.transactions.data.indexOf(transaction);
        if (index >= 0) {
          this.transactions.data.splice(index, 1);
          this.groupedTransactions = this.groupEntriesByDate(this.transactions.data);
          this.recalculateBalances();
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
        this.openingBalance = cashAccount.debit_balance;
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
