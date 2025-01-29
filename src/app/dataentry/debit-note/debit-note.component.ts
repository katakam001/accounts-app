import { Component, OnDestroy, OnInit } from '@angular/core';
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
import { Subscription } from 'rxjs'; // Import Subscription

@Component({
  selector: 'app-debit-note',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatCardModule,
    CommonModule,
    MatExpansionModule,
    MatIconModule
  ],
  templateUrl: './debit-note.component.html',
  styleUrls: ['./debit-note.component.css']
})
export class DebitNoteComponent implements OnInit,OnDestroy {
  private subscription: Subscription = new Subscription(); // Initialize the subscription
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
  ngOnDestroy() {
    this.subscription.unsubscribe(); // Clean up the subscription
    this.webSocketService.close();
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
    this.entryService.getEntriesByUserIdAndFinancialYearAndType(userId, this.financialYear, 6).subscribe((data: any[]) => {
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
      data: { userId: this.storageService.getUser().id, financialYear: this.financialYear, type: 6 }
    });

    dialogRef.afterClosed().subscribe();
  }

  openEditEntryDialog(entry: any, type: number = 6): void {
    const dialogRef = this.dialog.open(AddEditEntryDialogComponent, {
      width: '1000px',
      data: { entry, userId: this.storageService.getUser().id, financialYear: this.financialYear, type }
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
    console.log("hello");
    const currentUserId = this.storageService.getUser().id;
    const currentFinancialYear = this.financialYear;

    const handleEvent = (data: any, action: 'INSERT' | 'UPDATE' | 'DELETE') => {
      console.log(`Handling event: ${action}`, data);
      if (data.entryType === 'entry' && data.data.entry.type === 6 && data.user_id === currentUserId && data.financial_year === currentFinancialYear) {
        switch (action) {
          case 'INSERT':
            console.log('Processing INSERT event');
            this.entries.data = [...this.entries.data, data.data.entry];
            console.log('Inserted data:', this.entries.data);
            break;
          case 'UPDATE':
            console.log('Processing UPDATE event');
            const updateIndex = this.entries.data.findIndex(entry => entry.id === data.data.entry.id);
            if (updateIndex !== -1) {
              this.entries.data[updateIndex] = {
                ...this.entries.data[updateIndex],
                ...data.data.entry,
              };
              this.entries.data = [...this.entries.data];
              console.log('Updated data:', this.entries.data);
            }
            break;
          case 'DELETE':
            console.log('Processing DELETE event');
            console.log(data.data.entry.id);
            const deleteIndex = this.entries.data.findIndex(entry => entry.id === data.data.entry.id);
            console.log(deleteIndex);
            if (deleteIndex !== -1) {
              this.entries.data.splice(deleteIndex, 1);
              this.entries.data = [...this.entries.data];
            }
            break;
        }
        this.updateEntriesWithDynamicFields(this.entries.data);
      }
    };

    this.subscription.add(this.webSocketService.onEvent('INSERT').subscribe((data: any) => handleEvent(data, 'INSERT')));
    this.subscription.add(this.webSocketService.onEvent('UPDATE').subscribe((data: any) => handleEvent(data, 'UPDATE')));
    this.subscription.add(this.webSocketService.onEvent('DELETE').subscribe((data: any) => handleEvent(data, 'DELETE')));
  }

}
