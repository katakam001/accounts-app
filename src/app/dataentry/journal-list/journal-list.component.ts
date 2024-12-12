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

@Component({
  selector: 'app-journal-list',
  imports: [MatTableModule, MatToolbarModule, MatInputModule, ReactiveFormsModule, MatCardModule, MatSelectModule, MatIconModule, CommonModule,MatExpansionModule,MatListModule],
  templateUrl: './journal-list.component.html',
  styleUrls: ['./journal-list.component.css']
})
export class JournalListComponent implements OnInit {
  journalEntries = new MatTableDataSource<JournalEntry>();
  displayedColumns: string[] = ['journal_date', 'journal_description', 'user_name', 'actions'];
  nestedDisplayedColumns: string[] = ['account_name', 'group_name', 'debit_amount', 'credit_amount'];
  expandedElement: JournalEntry | null;
  financialYear: string;

    constructor(private journalService: JournalService, public dialog: MatDialog,    private storageService: StorageService,private financialYearService: FinancialYearService) {}
    ngOnInit(): void {
      this.getFinancialYear();
    }
  
    getFinancialYear() {
      this.financialYearService.financialYear$.subscribe(year => {
        this.financialYear = year;
        if (this.financialYear) {
          this.fetchJournalEntries(this.storageService.getUser().id, this.financialYear);
        }
      });
    }

  fetchJournalEntries(userId: number, financialYear: string): void {
    this.journalService.getJournalEntriesByUserIdAndFinancialYear(userId,financialYear).subscribe((data: JournalEntry[]) => {
      this.journalEntries.data = data.sort((a, b) => new Date(a.journal_date).getTime() - new Date(b.journal_date).getTime());
      console.log(this.journalEntries.data);

    });
  }

  addJournalEntry(): void {
    const dialogRef = this.dialog.open(AddJournalEntryDialogComponent, {
      width: '800px',
      data:this.financialYear
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.journalService.addJournalEntry(result).subscribe(() => {
          this.fetchJournalEntries(this.storageService.getUser().id,this.financialYear); // Refresh the journal list after adding a new entry
        });
      }
    });
  }

  editJournalEntry(entry:JournalEntry): void {
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
      this.fetchJournalEntries(this.storageService.getUser().id,this.financialYear); // Refresh the table by fetching the updated list of journal entries
    });
  }

  updateJournalItem(updatedEntry:JournalEntry): void {
    this.journalService.updateJournalEntry(updatedEntry).subscribe(() => {
      this.fetchJournalEntries(this.storageService.getUser().id,this.financialYear); // Refresh the table by fetching the updated list of journal entries
    });
  }
}
