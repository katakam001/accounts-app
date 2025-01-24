import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { AddEditProductionEntryDialogComponent } from '../../dialogbox/add-edit-production-entry-dialog/add-edit-production-entry-dialog.component';
import { ProductionService } from '../../services/production.service';
import { FinancialYearService } from '../../services/financial-year.service';
import { StorageService } from '../../services/storage.service';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { WebSocketService } from '../../services/websocket.service'; // Import WebSocket service

@Component({
  selector: 'app-production-entry',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatCardModule,
    CommonModule,
    MatExpansionModule,
    MatIconModule,
    FormsModule,
    MatSnackBarModule,
    MatTableModule
  ],
  templateUrl: './production-entry.component.html',
  styleUrls: ['./production-entry.component.css']
})
export class ProductionEntryComponent implements OnInit {
  entries: any[] = [];
  financialYear: string;
  expandedRows: { [key: number]: boolean } = {};

  constructor(
    private productionService: ProductionService,
    public dialog: MatDialog,
    private storageService: StorageService,
    private financialYearService: FinancialYearService,
    private snackBar: MatSnackBar,
    private webSocketService: WebSocketService // Inject WebSocket service
  ) {}

  ngOnInit(): void {
    this.getFinancialYear();
    this.subscribeToWebSocketEvents(); // Subscribe to WebSocket events
  }

  getFinancialYear() {
    const storedFinancialYear = this.financialYearService.getStoredFinancialYear();
    if (storedFinancialYear) {
      this.financialYear = storedFinancialYear;
      this.fetchEntries();
    }
  }

  fetchEntries(): void {
    const userId = this.storageService.getUser().id;
    this.productionService.getEntriesByUserIdAndFinancialYear(userId, this.financialYear).subscribe((data: any[]) => {
      this.entries = data;
    });
  }
  openAddEntryDialog(): void {
    const dialogRef = this.dialog.open(AddEditProductionEntryDialogComponent, {
      width: '1000px',
      data: { userId: this.storageService.getUser().id, financialYear: this.financialYear }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.productionService.addEntry(result).subscribe();
      }
    });
  }

  openEditEntryDialog(entry: any): void {
    const dialogRef = this.dialog.open(AddEditProductionEntryDialogComponent, {
      width: '1000px',
      data: { entry, userId: this.storageService.getUser().id, financialYear: this.financialYear }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.productionService.updateEntry(entry.id, result).subscribe();
      }
    });
  }

  deleteEntry(entryId: number): void {
    this.productionService.deleteEntry(entryId).subscribe();
  }

  expand(entry: any): void {
    this.expandedRows[entry.id] = !this.expandedRows[entry.id];
  }

subscribeToWebSocketEvents(): void {
  const currentUserId = this.storageService.getUser().id;
  const currentFinancialYear = this.financialYear;

  const handleEvent = (data: any, action: 'INSERT' | 'UPDATE' | 'DELETE') => {
    if (data.entryType === 'productionEntry' && data.user_id === currentUserId && data.financial_year === currentFinancialYear) { // Corrected entryType
      switch (action) {
        case 'INSERT':
          this.entries = [...this.entries, data.data];
          break;
        case 'UPDATE':
          const updateIndex = this.entries.findIndex(entry => entry.id === data.data.id);
          if (updateIndex !== -1) {
            this.entries[updateIndex] = {
              ...this.entries[updateIndex],
              ...data.data,
            };
          }
          break;
        case 'DELETE':
          const deleteIndex = this.entries.findIndex(entry => entry.id === data.data.id);
          if (deleteIndex !== -1) {
            this.entries.splice(deleteIndex, 1);
          }
          break;
      }
    }
  };

  this.webSocketService.onEvent('INSERT').subscribe((data: any) => handleEvent(data, 'INSERT'));
  this.webSocketService.onEvent('UPDATE').subscribe((data: any) => handleEvent(data, 'UPDATE'));
  this.webSocketService.onEvent('DELETE').subscribe((data: any) => handleEvent(data, 'DELETE'));
}
}
