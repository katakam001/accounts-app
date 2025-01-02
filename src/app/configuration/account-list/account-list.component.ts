import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { Account } from '../../models/account.interface';
import { AccountService } from '../../services/account.service';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { EditAccountDialogComponent } from '../../dialogbox/edit-account-dialog/edit-account-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { AddAccountDialogComponent } from '../../dialogbox/add-account-dialog/add-account-dialog.component';
import { StorageService } from '../../services/storage.service';
import { MatIconModule } from '@angular/material/icon';
import { FinancialYearService } from '../../services/financial-year.service';
import { Group } from '../../models/group.interface';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-account-list',
  standalone: true,
  imports: [MatCardModule, MatToolbarModule, MatTooltipModule, MatIconModule, MatTableModule, CommonModule, MatSortModule],
  templateUrl: './account-list.component.html',
  styleUrls: ['./account-list.component.css']
})
export class AccountListComponent implements OnInit {
  accounts = new MatTableDataSource<Account>();
  displayedColumns: string[] = ['name', 'description', 'debit_balance', 'credit_balance', 'group', 'address', 'isDealer', 'actions'];
  financialYear: string;
  totalDebits: number = 0;
  totalCredits: number = 0;

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private accountService: AccountService,
    public dialog: MatDialog,
    private storageService: StorageService,
    private financialYearService: FinancialYearService
  ) { }

  ngOnInit(): void {
    this.getFinancialYear();
    this.accounts.sort = this.sort; // Initialize sorting
  }

  getFinancialYear() {
    const storedFinancialYear = this.financialYearService.getStoredFinancialYear();
    if (storedFinancialYear) {
      this.financialYear = storedFinancialYear;
      this.fetchAccounts(this.storageService.getUser().id, this.financialYear);
    }
  }

  fetchAccounts(userId: number, financialYear: string): void {
    this.accountService.getAccountsByUserIdAndFinancialYear(userId, financialYear).subscribe((data: Account[]) => {
      this.accounts.data = data;
      this.accounts.sort = this.sort; // Set the sort after fetching the data
      this.calculateTotals();
    });
  }

  calculateTotals(): void {
    this.totalDebits = this.accounts.data.reduce((sum, account) => sum + account.debit_balance, 0);
    this.totalCredits = this.accounts.data.reduce((sum, account) => sum + account.credit_balance, 0);
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  }

  getDifference(): { value: string, class: string } {
    const difference = Math.abs(this.totalDebits - this.totalCredits);
    let type = 'neutral';
    if (this.totalDebits > this.totalCredits) {
      type = 'debit';
    } else if (this.totalCredits > this.totalDebits) {
      type = 'credit';
    }
    return { value: `${this.formatNumber(difference)} (${type})`, class: `difference-${type}` };
  }

  getGroupName(group: Group): string {
    return group ? group.name : '';
  }

  addAccount(): void {
    const dialogRef = this.dialog.open(AddAccountDialogComponent, {
      width: '800px',
      data: { userId: this.storageService.getUser().id, financialYear: this.financialYear }
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log("save the add account:" + result);
        this.accountService.addAccount(result).subscribe({
          next: (response) => {
            this.accounts.data.push(response); // Add the account if it doesn't exist
            this.accounts._updateChangeSubscription(); // Refresh the table
            this.calculateTotals(); // Recalculate totals after update
          },
          error: (error) => {
            console.error('Error updating account:', error);
          }
        });
      }
    });
  } 

  editAccount(account: Account): void {
    const dialogRef = this.dialog.open(EditAccountDialogComponent, {
      width: '800px',
      data: { userId: this.storageService.getUser().id, financialYear: this.financialYear, account: account }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Convert result to Account object and populate extra fields
        const newAccount: Account = {
          id: result.id,
          name: result.name,
          description: result.description,
          user_id: this.storageService.getUser().id,
          credit_balance: result.credit_balance,
          debit_balance: result.debit_balance,
          financial_year: result.financial_year,
          group: result.group, // Add group to the account object
          address: result.address, // Add address to the account object
          isDealer: result.isDealer // Add isDealer to the account object
        };
        console.log('Updated account:', newAccount);
        this.updateAccount(newAccount);
      }
    });
  }

  deleteAccount(id: number): void {
    this.accountService.deleteAccount(id).subscribe(response => {
      console.log('Response status:', response.status);
      this.fetchAccounts(this.storageService.getUser().id, this.financialYear); // Refresh the table by fetching the updated list of accounts
    });
  }

  updateAccount(updatedAccount: Account): void {
    this.accountService.updateAccount(updatedAccount).subscribe({
      next: (response) => {
        const index = this.accounts.data.findIndex(account => account.id === updatedAccount.id);
        if (index !== -1) {
          this.accounts.data[index] = response; // Use the response object to update the account
          this.accounts._updateChangeSubscription(); // Refresh the table
          this.calculateTotals(); // Recalculate totals after update
        }
      },
      error: (error) => {
        console.error('Error updating account:', error);
      }
    });
  }  
  
}
