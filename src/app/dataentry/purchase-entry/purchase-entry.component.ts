import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { AddEditEntryDialogComponent } from '../../dialogbox/add-edit-entry-dialog/add-edit-entry-dialog.component';
import { EntryService } from '../../services/entry.service';
import { FinancialYearService } from '../../services/financial-year.service';
import { StorageService } from '../../services/storage.service';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-purchase-entry',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatCardModule,
    CommonModule,
    MatExpansionModule,
    MatIconModule,
    MatCheckboxModule,
    FormsModule,
    MatSnackBarModule
  ],
  templateUrl: './purchase-entry.component.html',
  styleUrls: ['./purchase-entry.component.css']
})
export class PurchaseEntryComponent implements OnInit {
  entries: MatTableDataSource<any>;
  financialYear: string;
  expandedRows: { [key: number]: boolean } = {};

  constructor(
    private entryService: EntryService,
    public dialog: MatDialog,
    private storageService: StorageService,
    private financialYearService: FinancialYearService,
    private snackBar: MatSnackBar
  ) {
    this.entries = new MatTableDataSource<any>([]);
  }

  ngOnInit(): void {
    this.getFinancialYear();
  }

  getFinancialYear() {
    this.financialYearService.financialYear$.subscribe(year => {
      this.financialYear = year;
      if (this.financialYear) {
        this.fetchEntries();
      }
    });
  }

  fetchEntries(): void {
    const userId = this.storageService.getUser().id;
    this.entryService.getEntriesByUserIdAndFinancialYearAndType(userId, this.financialYear, 1).subscribe((data: any[]) => {
      this.entries.data = data;
      if (data.length > 0) {
        this.updateEntriesWithDynamicFields(data);
      }
    });
  }

  updateEntriesWithDynamicFields(data: any[]): void {
    data.forEach(entry => {
      entry.dynamicFields = entry.fields;
    });
    this.entries.data = data;
  }

  openAddEntryDialog(): void {
    const dialogRef = this.dialog.open(AddEditEntryDialogComponent, {
      width: '1000px',
      data: { userId: this.storageService.getUser().id, financialYear: this.financialYear, type: 1 }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.fetchEntries();
      }
    });
  }

  openEditEntryDialog(entry: any, type: number = 1): void {
    const dialogRef = this.dialog.open(AddEditEntryDialogComponent, {
      width: '1000px',
      data: { entry, userId: this.storageService.getUser().id, financialYear: this.financialYear, type }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.fetchEntries();
      }
    });
  }

  deleteEntry(entryId: number): void {
    this.entryService.deleteEntry(entryId).subscribe(() => {
      this.fetchEntries();
    });
  }

  expand(entry: any): void {
    this.expandedRows[entry.id] = !this.expandedRows[entry.id];
  }

  openPurchaseReturnDialog(): void {
    const selectedEntries = this.entries.data.filter((entry: any) => entry.selected);
    if (selectedEntries.length === 1) {
      const selectedEntry = selectedEntries[0];
      selectedEntry.type = 3; // Explicitly set the type to 3 for purchase returns
      console.log(selectedEntry);
      this.openEditEntryDialog(selectedEntry, 3);
    } else if (selectedEntries.length > 1) {
      this.snackBar.open('Please select one purchase entry to return it.', 'Close', {
        duration: 3000,
      });
    } else {
      this.snackBar.open('Please select a checkbox before proceeding.', 'Close', {
        duration: 3000,
      });
    }
  }
}
