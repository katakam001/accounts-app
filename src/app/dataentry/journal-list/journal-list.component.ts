import { Component, OnInit } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { JournalService } from '../../services/journal.service';
import { JournalEntry } from '../../models/journal-entry.interface';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { EditJournalEntryDialogComponent } from '../../dialogbox/edit-journal-entry-dialog/edit-journal-entry-dialog.component';
import { StorageService } from '../../services/storage.service';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { AddJournalEntryDialogComponent } from '../../dialogbox/add-journal-entry-dialog/add-journal-entry-dialog.component';
import { FinancialYearService } from '../../services/financial-year.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-journal-list',
  imports: [MatTableModule, MatToolbarModule, MatInputModule, ReactiveFormsModule, MatCardModule, MatSelectModule, MatIconModule, CommonModule, MatExpansionModule, MatListModule],
  templateUrl: './journal-list.component.html',
  styleUrls: ['./journal-list.component.css']
})
export class JournalListComponent implements OnInit {
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
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.getFinancialYear();
    this.route.queryParams.subscribe(params => {
      this.accountName = params['accountName'] || null;
      this.groupName = params['groupName'] || null;
      this.fetchJournalEntries();
    });
  }

  getFinancialYear() {
    this.financialYearService.financialYear$.subscribe(year => {
      this.financialYear = year;
      if (this.financialYear) {
        this.fetchJournalEntries();
      }
    });
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
        this.journalService.addJournalEntry(result).subscribe(() => {
          this.fetchJournalEntries(); // Refresh the journal list after adding a new entry
        });
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
        this.updateJournalItem(result);
      }
    });
  }

  deleteJournalEntry(id: number): void {
    this.journalService.deleteJournalEntry(id).subscribe(() => {
      this.fetchJournalEntries(); // Refresh the table by fetching the updated list of journal entries
    });
  }

  updateJournalItem(updatedEntry: JournalEntry): void {
    this.journalService.updateJournalEntry(updatedEntry).subscribe(() => {
      this.fetchJournalEntries(); // Refresh the table by fetching the updated list of journal entries
    });
  }
}
