import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { AddCashBookDialogComponent } from '../../dialogbox/add-cash-book-dialog/add-cash-book-dialog.component';
import { EditCashBookDialogComponent } from '../../dialogbox/edit-cash-book-dialog/edit-cash-book-dialog.component';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CashEntry } from '../../models/cash-entry.interface';
import { FinancialYearService } from '../../services/financial-year.service';
import { StorageService } from '../../services/storage.service';
import { CashEntriesService } from '../../services/cash-entries.service';

@Component({
  selector: 'app-cash-book',
  imports: [MatTableModule, MatToolbarModule, MatInputModule, ReactiveFormsModule, MatCardModule, MatSelectModule, MatIconModule, CommonModule, MatExpansionModule, MatListModule],
  templateUrl: './cash-book.component.html',
  styleUrls: ['./cash-book.component.css']
})
export class CashBookComponent implements OnInit {
  transactions: MatTableDataSource<CashEntry>;
  displayedColumns: string[] = ['cash_credit','cash_entry_date', 'account_name', 'narration_description', 'cash_debit', 'balance', 'actions'];
  currentBalance: number = 0;
  financialYear: string;

  constructor(
    public dialog: MatDialog,
    private financialYearService: FinancialYearService,
    private storageService: StorageService,
    private cashEntriesService: CashEntriesService
  ) {
    this.transactions = new MatTableDataSource<CashEntry>([]);
  }

  ngOnInit(): void {
    this.getFinancialYear();
  }

  getFinancialYear() {
    this.financialYearService.financialYear$.subscribe(year => {
      this.financialYear = year;
      if (this.financialYear) {
        this.fetchCashBook();
      }
    });
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
      this.recalculateBalances();
    });
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
      narration_description: transaction.narration_description,
      type: transaction.cash_debit > 0 ? false : true,
      cash_debit: transaction.cash_debit,
      cash_credit: transaction.cash_credit,
      amount:transaction.cash_debit>0?transaction.cash_debit:transaction.cash_credit,
      balance: 0, // Initial balance, will be recalculated
      user_id: this.storageService.getUser().id,
      financial_year: this.financialYear,
    };

    this.cashEntriesService.addCashEntry(newEntry).subscribe((data: CashEntry) => {
      transaction.id = data.id;
      transaction.balance = this.calculateBalance(transaction);
      this.transactions.data = [...this.transactions.data, transaction];
    });
  }

  updateTransaction(updatedTransaction: CashEntry): void {
    const updatedEntry = {
      id:updatedTransaction.id!,
      cash_entry_date: updatedTransaction.cash_entry_date,
      account_id: updatedTransaction.account_id,
      account_name:updatedTransaction.account_name,
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
          balance: this.calculateBalance(updatedTransaction)
        };
        this.transactions.data = [...this.transactions.data];
        this.recalculateBalances(); // Recalculate balances after updating a transaction
      }
    });
  }

  calculateBalance(transaction: CashEntry): number {
    const cashDebit = parseFloat(transaction.cash_debit.toString()) || 0;
    const cashCredit = parseFloat(transaction.cash_credit.toString()) || 0;

    if (cashDebit) {
      this.currentBalance -= cashDebit;
    } else if (cashCredit) {
      this.currentBalance += cashCredit;
    }
    return this.currentBalance;
  }
  

  deleteTransaction(transaction: CashEntry): void {
    if (transaction.id) {
      this.cashEntriesService.deleteCashEntry(transaction.id).subscribe(() => {
        const index = this.transactions.data.indexOf(transaction);
        if (index >= 0) {
          this.transactions.data.splice(index, 1);
          this.transactions.data = [...this.transactions.data];
          this.recalculateBalances();
        }
      });
    }
  }
  

  recalculateBalances(): void {
    this.currentBalance = 0;
    this.transactions.data.forEach(transaction => {
      transaction.balance = this.calculateBalance(transaction);
    });
  }
}
