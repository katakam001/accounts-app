import { Component, OnDestroy, OnInit } from '@angular/core';
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
import { BrokerService } from '../../services/broker.service';
import { AreaService } from '../../services/area.service';
import { UnitService } from '../../services/unit.service';
import { CategoryService } from '../../services/category.service';
import { AccountService } from '../../services/account.service';
import { ItemsService } from '../../services/items.service';
import { FieldService } from '../../services/field.service';
import { WebSocketService } from '../../services/websocket.service'; // Import WebSocket service
import { Subscription } from 'rxjs'; // Import Subscription

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
export class PurchaseEntryComponent implements OnInit, OnDestroy {
  private subscription: Subscription = new Subscription(); // Initialize the subscription
  entries: MatTableDataSource<any>;
  financialYear: string;
  expandedRows: { [key: number]: boolean } = {};
  brokerMap: { [key: number]: string } = {};
  areaMap: { [key: number]: string } = {};
  categoryMap: { [key: number]: string } = {};
  accountMap: { [key: number]: string } = {};
  itemMap: { [key: number]: string } = {};
  unitMap: { [key: number]: string } = {};
  fieldMap: { [key: number]: string } = {};
  constructor(
    private entryService: EntryService,
    public dialog: MatDialog,
    private storageService: StorageService,
    private financialYearService: FinancialYearService,
    private snackBar: MatSnackBar,
    private brokerService: BrokerService,
    private areaService: AreaService,
    private categoryService: CategoryService,
    private accountService: AccountService,
    private itemsService: ItemsService, // Inject ItemService
    private unitService: UnitService,
    private fieldService: FieldService,
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
    await Promise.all([this.fetchBrokers(), this.fetchAreas(), this.fetchCategories(1), this.fetchSuppliers(), this.fetchItems(), this.fetchUnits(), this.fetchFields()]);
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

  fetchCategories(type: number): Promise<void> {
    return new Promise((resolve) => {
      const userId = this.storageService.getUser().id;
      this.categoryService.getCategoriesByType(userId, this.financialYear, type).subscribe((data: any[]) => {
        data.forEach(category => {
          this.categoryMap[category.id] = category.name;
        });
        resolve();
      });
    });
  }

  fetchSuppliers(): Promise<void> {
    return new Promise((resolve) => {
      const userId = this.storageService.getUser().id;
      this.accountService.getAccountsByUserIdAndFinancialYear(userId, this.financialYear, ['Sundary Creditors', 'Sundary Debtors']).subscribe((accounts: any[]) => {
        accounts.forEach(account => {
          this.accountMap[account.id] = account.name;
        });
        resolve();
      });
    });
  }

  fetchItems(): Promise<void> {
    return new Promise((resolve) => {
      const userId = this.storageService.getUser().id;
      this.itemsService.getItemsByUserIdAndFinancialYear(userId, this.financialYear).subscribe((data: any[]) => {
        data.forEach(item => {
          this.itemMap[item.id] = item.name;
        });
        resolve();
      });
    });
  }

  fetchUnits(): Promise<void> {
    return new Promise((resolve) => {
      const userId = this.storageService.getUser().id;
      this.unitService.getUnitsByUserIdAndFinancialYear(userId, this.financialYear).subscribe((data: any[]) => {
        data.forEach(unit => {
          this.unitMap[unit.id] = unit.name;
        });
        resolve();
      });
    });
  }
  fetchFields(): Promise<void> {
    return new Promise((resolve) => {
      const userId = this.storageService.getUser().id;
      this.fieldService.getAllFieldsByUserIdAndFinancialYear(userId, this.financialYear).subscribe((data: any[]) => {
        data.forEach(field => {
          this.fieldMap[field.id] = field.field_name;
        });
        resolve();
      });
    });
  }

  updateEntriesWithDynamicFields(data: any[]): void {
    data.forEach(entry => {
      entry.category_name = this.categoryMap[entry.category_id];
      entry.account_name = this.accountMap[entry.account_id];
      entry.item_name = this.itemMap[entry.item_id];
      entry.unit_name = this.unitMap[entry.unit_id];
      entry.fields.forEach((field:any) => {
        field.field_name=this.fieldMap[field.field_id]
      });
      entry.dynamicFields = entry.fields;
    });
    this.entries.data = data;
  }

  openAddEntryDialog(): void {
    const dialogRef = this.dialog.open(AddEditEntryDialogComponent, {
      width: '1000px',
      data: { userId: this.storageService.getUser().id, financialYear: this.financialYear, type: 1 }
    });

    dialogRef.afterClosed().subscribe();
  }

  openEditEntryDialog(entry: any, type: number = 1, isPurchaseReturn: boolean = false): void {
    const dialogRef = this.dialog.open(AddEditEntryDialogComponent, {
      width: '1000px',
      data: { entry, userId: this.storageService.getUser().id, financialYear: this.financialYear, type, isPurchaseReturn }
    });

    dialogRef.afterClosed().subscribe();
  }

  deleteEntry(entryId: number): void {
    this.entryService.deleteEntry(entryId).subscribe();
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
      this.openEditEntryDialog(selectedEntry, 3, true);
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

  subscribeToWebSocketEvents(): void {
    console.log("hello");
    const currentUserId = this.storageService.getUser().id;
    const currentFinancialYear = this.financialYear;
  
    const handleEvent = (data: any, action: 'INSERT' | 'UPDATE' | 'DELETE') => {
      console.log(`Handling event: ${action}`, data);
      if (data.entryType === 'entry' && data.data.entry.type === 1 && data.user_id === currentUserId && data.financial_year === currentFinancialYear) {
        switch (action) {
          case 'INSERT':
            data.data.entry.fields.forEach((field:any) => {
              field.field_name = this.fieldMap[field.field_id];
            });
            const convertedObjectInsert = {
              ...data.data.entry,
              category_name: [this.categoryMap[data.data.entry.category_id]],
              account_name: this.accountMap[data.data.entry.account_id],
              item_name: this.itemMap[data.data.entry.item_id],
              unit_name: this.unitMap[data.data.entry.unit_id],
              dynamicFields: [...data.data.entry.fields]
            };
            console.log('Processing INSERT event');
            this.entries.data = [...this.entries.data, convertedObjectInsert];
            console.log('Inserted data:', this.entries.data);
            break;
          case 'UPDATE':
            console.log('Processing UPDATE event');
            const updateIndex = this.entries.data.findIndex(entry => entry.id === data.data.entry.id);
            if (updateIndex !== -1) {
              data.data.entry.fields.forEach((field:any) => {
                field.field_name = this.fieldMap[field.field_id];
              });
              const convertedObjectUpdate = {
                ...data.data.entry,
                category_name: [this.categoryMap[data.data.entry.category_id]],
                account_name: this.accountMap[data.data.entry.account_id],
                item_name: this.itemMap[data.data.entry.item_id],
                unit_name: this.unitMap[data.data.entry.unit_id],
                dynamicFields: [...data.data.entry.fields]
              };
              this.entries.data[updateIndex] = {
                ...this.entries.data[updateIndex],
                ...convertedObjectUpdate,
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
      }
    };
  
    this.subscription.add(this.webSocketService.onEvent('INSERT').subscribe((data: any) => handleEvent(data, 'INSERT')));
    this.subscription.add(this.webSocketService.onEvent('UPDATE').subscribe((data: any) => handleEvent(data, 'UPDATE')));
    this.subscription.add(this.webSocketService.onEvent('DELETE').subscribe((data: any) => handleEvent(data, 'DELETE')));
  }
  
}
