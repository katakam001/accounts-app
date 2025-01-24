import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { AddEditEntryDialogComponent } from '../../dialogbox/add-edit-entry-dialog/add-edit-entry-dialog.component';
import { EntryService } from '../../services/entry.service';
import { FinancialYearService } from '../../services/financial-year.service';
import { StorageService } from '../../services/storage.service';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CommonModule } from '@angular/common';
import { BrokerService } from '../../services/broker.service';
import { AreaService } from '../../services/area.service';
import { WebSocketService } from '../../services/websocket.service'; // Import WebSocket service

@Component({
  selector: 'app-credit-note',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatCardModule,
    CommonModule,
    MatExpansionModule,
    MatIconModule
  ],
  templateUrl: './credit-note.component.html',
  styleUrls: ['./credit-note.component.css']
})
export class CreditNoteComponent implements OnInit {
  entries: MatTableDataSource<any>;
  financialYear: string;
  expandedRows: { [key: number]: boolean } = {};
  brokerMap: { [key: number]: string } = {};
  areaMap: { [key: number]: string } = {};

  constructor(
    private entryService: EntryService,
    public dialog: MatDialog,
    private storageService: StorageService,
    private financialYearService: FinancialYearService,
    private brokerService: BrokerService,
    private areaService: AreaService,
    private webSocketService: WebSocketService // Inject WebSocket service
  ) {
    this.entries = new MatTableDataSource<any>([]);
  }

  ngOnInit(): void {
    this.getFinancialYear();
    this.subscribeToWebSocketEvents(); // Subscribe to WebSocket events
  }
  getFinancialYear() {
    const storedFinancialYear = this.financialYearService.getStoredFinancialYear();
    if (storedFinancialYear) {
      this.financialYear = storedFinancialYear;
      this.fetchBrokersAndAreas().then(() => {
        this.fetchEntries();
      });
    }
  }

  async fetchBrokersAndAreas(): Promise<void> {
    await Promise.all([this.fetchBrokers(), this.fetchAreas()]);
  }

  fetchEntries(): void {
    const userId = this.storageService.getUser().id;
    this.entryService.getEntriesByUserIdAndFinancialYearAndType(userId, this.financialYear, 5).subscribe((data: any[]) => {
      this.entries.data = data;
      if (data.length > 0) {
        this.updateEntriesWithDynamicFields(data);
      }
    });
  }

  fetchBrokers(): Promise<void> {
    return new Promise((resolve) => {
      const userId = this.storageService.getUser().id;
      this.brokerService.getBrokersByUserIdAndFinancialYear(userId, this.financialYear).subscribe((data: any[]) => {
        this.brokerMap = data.reduce((map, broker) => {
          map[broker.id] = broker.name;
          return map;
        }, {});
        resolve();
      });
    });
  }

  fetchAreas(): Promise<void> {
    return new Promise((resolve) => {
      const userId = this.storageService.getUser().id;
      this.areaService.getAreasByUserIdAndFinancialYear(userId, this.financialYear).subscribe((data: any[]) => {
        this.areaMap = data.reduce((map, area) => {
          map[area.id] = area.name;
          return map;
        }, {});
        resolve();
      });
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
      data: { userId: this.storageService.getUser().id, financialYear: this.financialYear, type: 5 }
    });

    dialogRef.afterClosed().subscribe();
  }

  openEditEntryDialog(entry: any): void {
    const dialogRef = this.dialog.open(AddEditEntryDialogComponent, {
      width: '1000px',
      data: { entry, userId: this.storageService.getUser().id, financialYear: this.financialYear, type: 5 }
    });

    dialogRef.afterClosed().subscribe();
  }

  deleteEntry(entryId: number): void {
    this.entryService.deleteEntry(entryId).subscribe();
  }

  expand(entry: any): void {
    this.expandedRows[entry.id] = !this.expandedRows[entry.id];
  }

  subscribeToWebSocketEvents(): void {
    const currentUserId = this.storageService.getUser().id;
    const currentFinancialYear = this.financialYear;

    const handleEvent = (data: any, action: 'INSERT' | 'UPDATE' | 'DELETE') => {
      if (data.entryType === 'entry' && data.data.type === 5 && data.user_id === currentUserId && data.financial_year === currentFinancialYear) {
        switch (action) {
          case 'INSERT':
            this.entries.data = [...this.entries.data, data.data.entry];
            break;
          case 'UPDATE':
            const updateIndex = this.entries.data.findIndex(entry => entry.id === data.data.id);
            if (updateIndex !== -1) {
              this.entries.data[updateIndex] = {
                ...this.entries.data[updateIndex],
                ...data.data.entry,
              };
              this.entries.data = [...this.entries.data];
            }
            break;
          case 'DELETE':
            const deleteIndex = this.entries.data.findIndex(entry => entry.id === data.data.id);
            if (deleteIndex !== -1) {
              this.entries.data.splice(deleteIndex, 1);
            }
            break;
        }
        this.updateEntriesWithDynamicFields(this.entries.data);
      }
    };

    this.webSocketService.onEvent('INSERT').subscribe((data: any) => handleEvent(data, 'INSERT'));
    this.webSocketService.onEvent('UPDATE').subscribe((data: any) => handleEvent(data, 'UPDATE'));
    this.webSocketService.onEvent('DELETE').subscribe((data: any) => handleEvent(data, 'DELETE'));
  }
}
