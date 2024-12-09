import { Component, OnInit } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Account } from '../models/account.interface';
import { AccountService } from '../account.service';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { EditAccountDialogComponent } from '../dialogbox/edit-account-dialog/edit-account-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { AddAccountDialogComponent } from '../dialogbox/add-account-dialog/add-account-dialog.component';
import { StorageService } from '../storage.service';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-account-list',
  imports: [MatTableModule, MatToolbarModule, MatInputModule, ReactiveFormsModule, MatCardModule, MatSelectModule, MatIconModule, CommonModule],
  templateUrl: './account-list.component.html',
  styleUrls: ['./account-list.component.css']
})
export class AccountListComponent implements OnInit {
  accounts = new MatTableDataSource<Account>();
  displayedColumns: string[] = ['name', 'description', 'balance', 'financial_year', 'actions'];
  financialYears: string[] = [];
  selectedFinancialYear: string = '';

  constructor(private accountService: AccountService, public dialog: MatDialog, private storageService: StorageService
  ) { }

  ngOnInit(): void {
    this.fetchAccounts();
  }

  fetchAccounts(): void {
    this.accountService.getAccounts().subscribe((data: Account[]) => {
      this.accounts.data = data;
      this.financialYears = [...new Set(data.map(account => account.financial_year))];
    });
  }
  applyFilter(): void {
    this.accounts.filter = this.selectedFinancialYear.trim().toLowerCase();
  }

  addAccount(): void {
    const dialogRef = this.dialog.open(AddAccountDialogComponent, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log("save the add account:" + result);
      this.accountService.addAccount(result).subscribe(() => {
        this.fetchAccounts(); // Refresh the account list after adding a new account
      });
    });
  }

  editAccount(account: Account): void {
    const dialogRef = this.dialog.open(EditAccountDialogComponent, {
      width: '400px',
      data: account
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Convert result to Account object and populate extra fields
        const newAccount: Account = {
          id: result.id,
          name: result.name,
          description: result.description,
          user_id: this.storageService.getUser().id,
          balance: result.balance,
          financial_year: result.financial_year
        };
        console.log('Updated account:', newAccount);
        this.updateAccount(newAccount);
      }
    });
  }

  deleteAccount(id: number): void {
    this.accountService.deleteAccount(id).subscribe(response => {
      console.log('Response status:', response.status);
      this.fetchAccounts(); // Refresh the table by fetching the updated list of accounts
    });
  }


  updateAccount(updatedAccount: Account): void {
    this.accountService.updateAccount(updatedAccount).subscribe(() => {
      // Refresh the table after updating the account in the database
      const index = this.accounts.data.findIndex(account => account.id === updatedAccount.id);
      if (index !== -1) {
        this.accounts.data[index] = updatedAccount;
        this.accounts._updateChangeSubscription(); // Refresh the table
      }
    });
  }
}
