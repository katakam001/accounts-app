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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-account-list',
  standalone: true,
  imports: [MatCardModule, MatToolbarModule, MatTooltipModule, MatIconModule, MatTableModule, CommonModule, MatSortModule,MatSnackBarModule,FormsModule,MatInputModule],
  templateUrl: './account-list.component.html',
  styleUrls: ['./account-list.component.css']
})
export class AccountListComponent implements OnInit {
  accounts = new MatTableDataSource<Account>();
  originalData: Account[] = [];
  displayedColumns: string[] = ['name', 'gst_no', 'debit_balance', 'credit_balance', 'group', 'address', 'isDealer', 'actions'];
  financialYear: string;
  totalDebits: number = 0;
  totalCredits: number = 0;

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private accountService: AccountService,
    public dialog: MatDialog,
    private storageService: StorageService,
    private financialYearService: FinancialYearService,
    private snackBar: MatSnackBar // Inject MatSnackBar
  ) { }

  ngOnInit(): void {
    this.getFinancialYear();
  }
  applyFilter(event: any) {
    const filterValue = event.target.value.trim().toLowerCase();
    if (!filterValue) {
      // Reset data to the original if the search field is empty
      this.accounts.data = [...this.originalData];
    } else {
      // Filter accounts based on name, GST number, or group
      this.accounts.data = this.originalData.filter(account =>
        account.name.toLowerCase().includes(filterValue) ||
        account.gst_no?.toLowerCase().includes(filterValue) ||
        account.group.name.toLowerCase().includes(filterValue)
      );
    }
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
      this.originalData = [...this.accounts.data]; // Initialize filtered accounts
      // 🧠 Sorting for nested fields
      this.accounts.sortingDataAccessor = (item, property) => {
        switch (property) {
          case 'group': return item.group?.name?.toLowerCase() || '';
          case 'address':
            const city = item.address?.city?.toLowerCase() || '';
            const street = item.address?.street?.toLowerCase() || '';
            return `${city} ${street}`.trim();
          case 'debit_balance':
            return typeof item.debit_balance === 'number'
              ? item.debit_balance
              : parseFloat(item.debit_balance) || 0;
          case 'credit_balance':
            return typeof item.credit_balance === 'number'
              ? item.credit_balance
              : parseFloat(item.credit_balance) || 0;
          default: return (item as any)[property];
        }
      };
      this.accounts.sort = this.sort; // Set the sort after fetching the data
      this.calculateTotals();
    });
  }

  calculateTotals(): void {

    const toNumber = (val: any): number => typeof val === 'number' ? val : parseFloat(val) || 0;

    // 💰 Calculate totals
    this.totalDebits = this.accounts.data.reduce(
      (sum, account) => sum + toNumber(account.debit_balance),
      0
    );
    this.totalCredits = this.accounts.data.reduce(
      (sum, account) => sum + toNumber(account.credit_balance),
      0
    );
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
        console.log('Saving account:', result);
        this.accountService.addAccount(result).subscribe({
          next: (response) => {
            this.accounts.data = [...this.accounts.data, response];
            this.originalData = [...this.accounts.data]; // Initialize filtered accounts
            this.accounts._updateChangeSubscription();
            this.calculateTotals();
            // Show success message
            this.snackBar.open(`Account "${response.name}" added successfully.`,'Close',{ duration: 3000 });
          },
          error: (error) => {
            // Display the error directly from the service response
            this.snackBar.open(error.message, 'Close', { duration: 5000 });
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
        const newAccount: Account = {
          id: result.id,
          name: result.name,
          gst_no: result.gst_no,
          user_id: this.storageService.getUser().id,
          credit_balance: result.credit_balance,
          debit_balance: result.debit_balance,
          financial_year: result.financial_year,
          group: result.group,
          address: result.address,
          isDealer: result.isDealer
        };
        console.log('Updating account:', newAccount);
        this.updateAccount(newAccount);
      }
    });
  }

  deleteAccount(id: number,name:string): void {
    this.accountService.deleteAccount(id).subscribe({
      next: () => {
        this.accounts.data = this.accounts.data.filter(account => account.id !== id);
        this.originalData = [...this.accounts.data]; // Initialize filtered accounts
        this.accounts._updateChangeSubscription();
        this.calculateTotals();
        this.snackBar.open(`Account "${name}" deletion is successfully.`,'Close',{ duration: 3000 });
      },
      error: (error) => {
        this.snackBar.open(error.message, 'Close', { duration: 10000 });
      }
    });
  }

updateAccount(updatedAccount: Account): void {
  this.accountService.updateAccount(updatedAccount).subscribe({
    next: (response) => {
      const index = this.accounts.data.findIndex(account => account.id === updatedAccount.id);
      if (index !== -1) {
        // Create a new array with the updated account
        const newData = [...this.accounts.data];
        newData[index] = response;
        this.accounts.data = newData;
        this.originalData = [...this.accounts.data]; // Initialize filtered accounts
        this.accounts._updateChangeSubscription(); // Refresh the table
        this.calculateTotals(); // Recalculate totals after update
        this.snackBar.open(`Account "${response.name}" updation is successfully.`,'Close',{ duration: 3000 });
      }
    },
    error: (error) => {
      this.snackBar.open(error.message, 'Close', { duration: 5000 });
    }
  });
}
}
