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
import { CommonModule, DatePipe } from '@angular/common';
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
import { Account } from '../../models/account.interface';
import { GroupMappingService } from '../../services/group-mapping.service';
import { GroupNode } from '../../models/group-node.interface';
import { FieldMappingService } from '../../services/field-mapping.service';
import { ConfirmationDialogComponent } from '../../dialogbox/confirmation-dialog/confirmation-dialog.component';
import { EntryCachedPage } from '../../models/entry-cache-key.interface';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SummaryDialogComponent } from '../../dialogbox/summary-dialog/summary-dialog.component';
import { SummaryService } from '../../services/summary.service';
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
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
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
  gstNoMap: { [key: number]: string } = {};
  itemMap: { [key: number]: string } = {};
  unitMap: { [key: number]: string } = {};
  fieldMap: { [key: number]: string } = {};
  fieldMapping: { [key: string]: any } = {};
  taxAccountMap: Map<number, string> = new Map();
  groupMapping: any[] = []; // Add fields array
  groupedEntries: any[] = [];
   cache = new Map<number, EntryCachedPage>(); // Cache for pages
   currentPage = 1;
   pageSize = 300;
   totalPages = 0;
   hasMore = true;
   nextStartRow = 1;
   fromDate: Date | null = null; // Store the 'from' date
   toDate: Date | null = null;
   financialYearstartDate: Date;
   financialYearendDate: Date;
   totalSummary:any;
   pageSummary: any;
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
    private groupMappingService: GroupMappingService, // Inject FieldMappingService
    private fieldMappingService: FieldMappingService,
    private summaryService: SummaryService,
    private datePipe: DatePipe,
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
        const [startYear, endYear] = this.financialYear.split('-').map(Number);
        this.financialYearstartDate = new Date(startYear, 3, 1); // April 1st of start year
        this.financialYearendDate = new Date(endYear, 2, 31); // March 31st of end year
        this.fromDate = this.financialYearstartDate;
        this.toDate= this.financialYearendDate;
        this.applyDateFilter();
      });
    }
  }
  applyDateFilter(): void {
    if (this.fromDate && this.toDate) {

      // Clear cache and reset pagination
      this.cache.clear();
      this.currentPage = 1;
      this.hasMore = true;
      this.nextStartRow = 1;

      // Trigger fetchEntries to load filtered data
      this.fetchEntries();
      this.fetchSummary();
    }
  } 
  dateFilter = (date: Date | null): boolean => {
    if (!date) {
      return false; // Ignore null dates
    }
  
    // Return whether the date falls within the financial year range
    return date >= this.financialYearstartDate && date <= this.financialYearendDate;
  };
  async fetchBrokersAndAreas(): Promise<void> {
    await Promise.all([this.fetchBrokers(), this.fetchAreas(), this.fetchCategories(1), this.fetchSuppliers(), this.fetchItems(), this.fetchUnits(), this.fetchFields(),this.fetchGroupMapping(),this.fetchPurchaseEntryAccounts(),this.fetchDynamicFields()]);
  }
  fetchSummary(): void {
    const userId = this.storageService.getUser().id;
    const fromDateStr = this.datePipe.transform(this.fromDate, 'yyyy-MM-dd', 'en-IN') as string; // Transform to desired format
    const toDateStr = this.datePipe.transform(this.toDate, 'yyyy-MM-dd', 'en-IN') as string; // Transform to desired format
    this.entryService.getTaxSummary(userId,this.financialYear, 1,fromDateStr || undefined, toDateStr || undefined).subscribe(data => {
    this.totalSummary=this.updateSummaryWithAccountName(data);
    });
  }
  updateSummaryWithAccountName(data: any[]): any[] {
    data.forEach(entry => {
      entry.category_account_name= this.taxAccountMap.get(entry.category_account_id) || '';
    });
    return data;
  }
  fetchEntries(): void {
    const userId = this.storageService.getUser().id;
    console.log(this.taxAccountMap);
    const fromDateStr = this.datePipe.transform(this.fromDate, 'yyyy-MM-dd', 'en-IN') as string; // Transform to desired format
    const toDateStr = this.datePipe.transform(this.toDate, 'yyyy-MM-dd', 'en-IN') as string; // Transform to desired format  
    this.entryService.getEntriesByUserIdAndFinancialYearAndType(userId, this.financialYear, 1, this.nextStartRow, this.pageSize,fromDateStr || undefined,toDateStr || undefined).subscribe(data => {
        const entries = this.updateEntriesWithDynamicFields(data.entries);
        this.groupedEntries = this.groupEntriesByinvoiceSeqId(entries);
        this.pageSummary=this.summaryService.calculatePageSummary(this.groupedEntries);
        console.log(this.pageSummary);
        console.log(this.groupedEntries);
      this.hasMore = data.hasMore;
      this.nextStartRow = data.nextStartRow;
      if(this.groupedEntries.length>0){
      this.cache.set(this.currentPage, {
        dataRange: this.getDataRange(this.groupedEntries), // Calculate data range based on entries
        data: this.groupedEntries
      });
    }
    });
  }
    getDataRange(group: any[]): { start: number, end: number } {
      if (group.length === 0) {
        return { start: 0, end: 0 };
      }
  
      const start = new Date(group[0].entry_date).getTime();
      const end = new Date(group[group.length - 1].entry_date).getTime();
      return { start, end };
    }

    groupEntriesByinvoiceSeqId(entries: any[]): any[] {
    const groupedEntries: { [key: string]: any } = {};
    
    // Group entries by invoice number
    entries.forEach(entry => {
      const invoice_seq_id = entry.invoice_seq_id;
      if (!groupedEntries[invoice_seq_id]) {
        groupedEntries[invoice_seq_id] = {
          invoice_seq_id: entry.invoice_seq_id,
          invoiceNumber: entry.invoiceNumber,
          entry_date: entry.entry_date,
          account_id: entry.account_id,
          customerName: entry.account_name,
          gstNo:entry.gstNo,
          groupEntryValue: 0,
          groupTotalAmount: 0,
          entries: []
        };
      }
      groupedEntries[invoice_seq_id].groupEntryValue += Number(entry.value);
      groupedEntries[invoice_seq_id].groupTotalAmount += Number(entry.total_amount);
      groupedEntries[invoice_seq_id].entries.push(entry);
    });
  
    // Convert groupedEntries to an array and sort by saleDate in ascending order
    return Object.values(groupedEntries).sort((a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime());
  }

    onNextPage() {
    const userId = this.storageService.getUser().id;
    if (this.cache.has(this.currentPage + 1) || this.hasMore) {
      this.currentPage += 1;
      this.fetchEntriesWithPagination(userId);
    }
  }

  onPreviousPage() {
    const userId = this.storageService.getUser().id;
    if (this.currentPage > 1) {
      this.currentPage -= 1;
      this.fetchEntriesWithPagination(userId);
    }
  }

  fetchEntriesWithPagination(userId: number): void {
    if (this.cache.has(this.currentPage)) {
      // Use cached data if available
      this.groupedEntries = this.cache.get(this.currentPage)?.data || []; // Provide default empty array if data is not present
      this.pageSummary=this.summaryService.calculatePageSummary(this.groupedEntries);
    } else {
      const fromDateStr = this.datePipe.transform(this.fromDate, 'yyyy-MM-dd', 'en-IN') as string; // Transform to desired format
      const toDateStr = this.datePipe.transform(this.toDate, 'yyyy-MM-dd', 'en-IN') as string; // Transform to desired format  
      // Fetch from the backend if not in cache
      this.entryService.getEntriesByUserIdAndFinancialYearAndType(userId, this.financialYear, 1, this.nextStartRow, this.pageSize,fromDateStr || undefined,toDateStr || undefined).subscribe(data => {
        const entries = this.updateEntriesWithDynamicFields(data.entries);
        this.groupedEntries = this.groupEntriesByinvoiceSeqId(entries);
        console.log(this.groupedEntries);
        this.pageSummary=this.summaryService.calculatePageSummary(this.groupedEntries);
        console.log(this.pageSummary);
        this.hasMore = data.hasMore;
        this.nextStartRow = data.nextStartRow;
        this.cache.set(this.currentPage, {
          dataRange: this.getDataRange(this.groupedEntries), // Calculate data range based on entries
          data: this.groupedEntries
        }); // Cache the fetched data
        console.log(this.cache);
      });
    }
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
      this.accountService.getAccountsByUserIdAndFinancialYear(userId, this.financialYear, ['Sundry Creditors', 'Sundry Debtors']).subscribe((accounts: any[]) => {
        accounts.forEach(account => {
          this.accountMap[account.id] = account.name;
          this.gstNoMap[account.id]=account.gst_no;
        });
        resolve();
      });
    });
  }

  fetchPurchaseEntryAccounts(): Promise<void> {
    return new Promise((resolve) => {
      const userId = this.storageService.getUser().id;
      this.accountService.getAccountsByUserIdAndFinancialYear(userId, this.financialYear, ['Purchase Account']).subscribe((accounts: any[]) => {
          accounts.forEach(account => {
            this.taxAccountMap.set(account.id, account.name);
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

    fetchDynamicFields(): Promise<void> {
      return new Promise((resolve) => {
      const userId = this.storageService.getUser().id;
      this.fieldMappingService.getFieldMappingsByUserIdAndFinancialYear(userId, this.financialYear).subscribe((data: any[]) => {
        data.forEach(field => {
          this.fieldMapping[this.createCompositeKey(field.category_id,field.field_id)] = field;
        });
        resolve();
      });
    });
  }
   createCompositeKey(key1: number, key2: number): string {
    return `${key1}-${key2}`;
  }
  updateEntriesWithDynamicFields(data: any[]): any[] {
    data.forEach(entry => {
      entry.category_name = this.categoryMap[entry.category_id];
      entry.account_name = this.accountMap[entry.account_id];
      entry.item_name = this.itemMap[entry.item_id];
      entry.unit_name = this.unitMap[entry.unit_id];
      entry.category_account_name= this.taxAccountMap.get(entry.category_account_id) || '';
      entry.gstNo=this.gstNoMap[entry.account_id] || '';
      entry.fields.forEach((field:any) => {
        field.field_name=this.fieldMap[field.field_id]
        const fieldMapping = this.fieldMapping[this.createCompositeKey(entry.category_id,field.field_id)]
        field.field_category=fieldMapping.field_category
        field.tax_account_id=fieldMapping.account_id
      });
      entry.dynamicFields = entry.fields;
    });
    return data;
  }

    // Function to find a node by its name
    findNodeByName(node: GroupNode, name: string): GroupNode | null {
      if (node.name === name) {
        return node;
      }
  
      if (node.children && node.children.length) {
        for (const child of node.children) {
          const result = this.findNodeByName(child, name);
          if (result) {
            return result;
          }
        }
      }
  
      return null;
    }
  
    // Function to extract account IDs from a node and return a set of unique IDs
    extractAccountIds(node: GroupNode, result = new Set<number>()): number[] {
      if (!node.children || node.children.length === 0) {
        // This is an account node
        result.add(Number(node.id));
      } else {
        // This is a group node, traverse its children
        node.children.forEach(child => this.extractAccountIds(child, result));
      }
      // Convert the set to an array for the final output
      return Array.from(result);
    }
  
    getNodeByName(nodeName: string): GroupNode | null {
      for (const node of this.groupMapping) {
        const result = this.findNodeByName(node, nodeName);
        if (result) {
          return result;
        }
      }
      return null;
    }
  
    // Function to get account IDs from a specific node by its name
    getAccountIdsFromNodeByName(nodeName: string): number[] {
      const node = this.getNodeByName(nodeName);
      console.log(node);
      if (node) {
        return this.extractAccountIds(node);
      } else {
        console.error('Node not found');
        return [];
      }
    }

    fetchGroupMapping(): Promise<void> {
      return new Promise((resolve) => {
        this.groupMappingService.getGroupMappingTree(this.storageService.getUser().id, this.financialYear).subscribe(data => {
          this.groupMapping = data;
          const accountIds = this.getAccountIdsFromNodeByName('Indirect Expenses');
          this.fetchAccounts(accountIds);
          console.log('Accounts:', accountIds);
          resolve();
        });
      });
    }
    fetchAccounts(accountIds: number[]): void {
      this.accountService.getAccountsByUserIdAndFinancialYear(this.storageService.getUser().id, this.financialYear).subscribe((accounts: Account[]) => {
        const filteredAccounts = accounts.filter(account => accountIds.includes(account.id));
        this.taxAccountMap = new Map(filteredAccounts.map(account => [account.id, account.name]));
      });
    }

    openConfirmationDialog(action: string, data: any): void {
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        data: { action }
      });
  
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.performAction(action, data);
        }
      });
    }
    performAction(action: string, data: any): void {
      if (action === 'add') {
       this.openAddEntryDialog();
        console.log('Adding:', data);
      } else if (action === 'edit') {
       this.openEditGroupDialog(data);
        console.log('Editing:', data);
      } else if (action === 'delete') {
        this.deleteGroup(data);
        console.log('Deleting:', data);
      }
    }

  openAddEntryDialog(): void {
    const dialogRef = this.dialog.open(AddEditEntryDialogComponent, {
      width: '1250px',
      data: { userId: this.storageService.getUser().id, financialYear: this.financialYear, type: 1 }
    });

    dialogRef.afterClosed().subscribe();
  }

  openEditGroupDialog(group: any, type: number = 1, isPurchaseReturn: boolean = false): void {
    const dialogRef = this.dialog.open(AddEditEntryDialogComponent, {
      width: '1250px',
      data: { group, userId: this.storageService.getUser().id, financialYear: this.financialYear, type, isPurchaseReturn }
    });

    dialogRef.afterClosed().subscribe();
  }

  deleteGroup(invoice_seq_id: number): void {
    this.entryService.deleteEntries(invoice_seq_id,1).subscribe();
  }

   // Methods to call the dialog with different actions
   addEntry(): void {
    this.openConfirmationDialog('add', null);
  }

  editEntry(data: any): void {
    this.openConfirmationDialog('edit', data);
  }

  deleteEntry(data: any): void {
    this.openConfirmationDialog('delete', data);
  }

  expand(entry: any): void {
    this.expandedRows[entry.id] = !this.expandedRows[entry.id];
  }

  openPurchaseReturnDialog(): void {
    const selectedGroupes = this.groupedEntries.filter((group: any) => group.selected);
    if (selectedGroupes.length === 1) {
      const selectedGroup = selectedGroupes[0];
      selectedGroup.type = 3; // Explicitly set the type to 3 for purchase returns
      console.log(selectedGroup);
      this.openEditGroupDialog(selectedGroup, 3, true);
    } else if (selectedGroupes.length > 1) {
      this.snackBar.open('Please select one purchase entry to return it.', 'Close', {
        duration: 3000,
      });
    } else {
      this.snackBar.open('Please select a checkbox before proceeding.', 'Close', {
        duration: 3000,
      });
    }
  }
  openSummaryDialog(): void {
    this.dialog.open(SummaryDialogComponent, {
      width: '90%',
      data: {
        pageSummary: this.pageSummary,
        totalSummary: this.totalSummary,
      },
    });
  }
  subscribeToWebSocketEvents(): void {
    console.log("hello");
    const currentUserId = this.storageService.getUser().id;
    const currentFinancialYear = this.financialYear;

    const handleEvent = (data: any, action: 'INSERT' | 'UPDATE' | 'DELETE') => {
      console.log(`Handling event: ${action}`, data);
      const entryDate = new Date(data.journal_date).getTime(); // Convert journal_date to timestamp for comparison
      const fromDateTimestamp = this.fromDate ? new Date(Date.UTC(this.fromDate.getFullYear(),this.fromDate.getMonth(),this.fromDate.getDate())).getTime() : null; // Convert fromDate to timestamp
      const toDateTimestamp = this.toDate ? new Date(Date.UTC(this.toDate.getFullYear(),this.toDate.getMonth(),this.toDate.getDate())).getTime(): null; // Convert toDate to timestamp
      if (data.entryType === 'entry' && data.data.group.type === 1 && data.user_id === currentUserId && data.financial_year === currentFinancialYear &&
        (!fromDateTimestamp || entryDate >= fromDateTimestamp) && // Check if entryDate is on or after fromDate
        (!toDateTimestamp || entryDate <= toDateTimestamp)) {
        switch (action) {
          case 'INSERT':
            handleInsert(data);
            break;
          case 'UPDATE':
            handleUpdate(data);
            break;
          case 'DELETE':
            handleDelete(data);
            break;
        }
      }
    };

    this.subscription.add(this.webSocketService.onEvent('INSERT').subscribe((data: any) => handleEvent(data, 'INSERT')));
    this.subscription.add(this.webSocketService.onEvent('UPDATE').subscribe((data: any) => handleEvent(data, 'UPDATE')));
    this.subscription.add(this.webSocketService.onEvent('DELETE').subscribe((data: any) => handleEvent(data, 'DELETE')));


    const updateCache = (page: EntryCachedPage, action: 'INSERT' | 'UPDATE' | 'DELETE', group: any) => {
      switch (action) {
        case 'INSERT':
          page.data.push(group);
          page.data.sort((a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime());
          if (this.hasMore) {
            this.nextStartRow += group.entries?.length || 0;
          }
          break;
        case 'UPDATE':
          const updateIndex = page.data.findIndex(e => e.invoice_seq_id === group.invoice_seq_id);
          console.log(updateIndex);
          console.log(page.data[updateIndex]);
          console.log(group);
          if (updateIndex !== -1) {
            if (this.hasMore) {
              this.nextStartRow -= page.data[updateIndex].entries?.length || 0;
              this.nextStartRow += group.entries?.length || 0;
            }
            page.data[updateIndex] = { ...page.data[updateIndex], ...group };
          }
          break;
        case 'DELETE':
          const deleteIndex = page.data.findIndex(e => e.invoice_seq_id === group.invoice_seq_id);
          if (deleteIndex !== -1) {
            page.data.splice(deleteIndex, 1);
            if (this.hasMore) {
              this.nextStartRow -= group.entries?.length || 0;
            }
          }
          break;
      }
    };

    const handleInsert = (data: any) => {
      // Extract items based on the entry 
      let group: any;

      
      data.data.entries.forEach((entry: any) => {

        const convertedObjectInsert = {
          ...entry,
          category_name: [this.categoryMap[entry.category_id]],
          item_name: this.itemMap[entry.item_id],
          unit_name: this.unitMap[entry.unit_id],
          category_account_name: this.taxAccountMap.get(entry.category_account_id) || ''
        };

        // Check if the invoice number already exists
        if (!group) {
          group = {
            invoiceNumber: entry.invoiceNumber,
            invoice_seq_id: entry.invoice_seq_id,
            entry_date: entry.entry_date,
            customerName: this.accountMap[entry.account_id],
            gstNo:this.gstNoMap[entry.account_id] || '',
            account_id: entry.account_id,
            groupEntryValue: 0,
            groupTotalAmount: 0,
            entries: []
          };
        }
        group.groupEntryValue += Number(entry.value);
        group.groupTotalAmount += Number(entry.total_amount);
        group.entries.push(convertedObjectInsert);
      });  
   
       console.log(this.cache.entries())
      // Update cache if the date range fits within existing pages
      for (const [pageNumber, page] of this.cache.entries()) {
        console.log(pageNumber);
        console.log(page);
        if (
          (new Date(group.entry_date).getTime() >= page.dataRange.start &&
          new Date(group.entry_date).getTime() <= page.dataRange.end) || (page.data.length < this.pageSize && !this.cache.has(pageNumber+1))
        ) {
          updateCache(page, 'INSERT', group);
          if (Number(pageNumber) === this.currentPage) {  // Convert pageNumber to a number before comparison
            this.groupedEntries = page.data;
          }
          return;
        }
      }

      // Handle new page creation for future-dated records
      if (!this.hasMore) {
        const keys = Array.from(this.cache.keys());
        const lastPage = keys.length ? Math.max(...keys) : 0; // Default to 1 if empty
      
        const lastPageEntry = this.cache.get(lastPage);
        if (lastPage === 0  || (lastPageEntry && new Date(group.entry_date).getTime() > lastPageEntry.dataRange.end)) {
          this.cache.set(lastPage + 1, {
            data: [group],
            dataRange: {
              start: new Date(group.entry_date).getTime(),
              end: new Date(group.entry_date).getTime()
            }
          });
          if(lastPage === 0)
            this.groupedEntries.push(group);
        }
      }

      // If the entry doesn't fit in any existing pages, handle new page creation logic here
      console.log('Inserted data:', this.groupedEntries);
    };

    const handleUpdate = (data: any) => {
      console.log('Processing UPDATE event');
      // Filter items based on accountId or groupId

      let group:any;
      
      data.data.entries.forEach((entry: any) => {

        const convertedObjectUpdate = {
          ...entry,
          category_name: [this.categoryMap[entry.category_id]],
          item_name: this.itemMap[entry.item_id],
          unit_name: this.unitMap[entry.unit_id],
          category_account_name: this.taxAccountMap.get(entry.category_account_id) || ''
        };

        // Check if the invoice number already exists
        if (!group) {
          group = {
            invoiceNumber: entry.invoiceNumber,
            invoice_seq_id:data.data.invoice_seq_id,
            entry_date: entry.entry_date,
            customerName: this.accountMap[entry.account_id],
            gstNo:this.gstNoMap[entry.account_id] || '',
            account_id: entry.account_id,
            groupEntryValue: 0,
            groupTotalAmount: 0,
            entries: []
          };
        }
        group.groupEntryValue += Number(entry.value);
        group.groupTotalAmount += Number(entry.total_amount);
        group.entries.push(convertedObjectUpdate);
      });
        console.log('Updated data:', group);

      for (const [pageNumber, page] of this.cache.entries()) {
        if ((new Date(group.entry_date).getTime() >= page.dataRange.start
        && new Date(group.entry_date).getTime() <= page.dataRange.end && page.data.some((entry: any) => entry.invoice_seq_id === group.invoice_seq_id)) || (page.data.length < this.pageSize && page.data.some((entry: any) => entry.invoice_seq_id === group.invoice_seq_id))) {
          updateCache(page, 'UPDATE', group);
          if (Number(pageNumber) === this.currentPage) {  // Convert pageNumber to a number before comparison
            this.groupedEntries = page.data;
          }
          return;
        }
      }

      // If the entry doesn't fit in any existing pages, handle new page creation logic here
      console.log('Updated data:', this.groupedEntries);
    };

    const handleDelete = (data: any) => {
      console.log('Processing DELETE event');
      const invoice_seq_id =  data.data.group.invoice_seq_id;
      const entry_date =  data.data.group.journal_date;
      console.log(invoice_seq_id);
      console.log(entry_date);

      for (const [pageNumber, page] of this.cache.entries()) {
        if (new Date(entry_date).getTime() >= page.dataRange.start
          && new Date(entry_date).getTime() <= page.dataRange.end && page.data.some((entry: any) => entry.invoice_seq_id === invoice_seq_id)) {
            console.log(pageNumber);
            console.log(page);
          updateCache(page, 'DELETE', { invoice_seq_id: invoice_seq_id });
          if (Number(pageNumber) === this.currentPage) {  // Convert pageNumber to a number before comparison
            this.groupedEntries = page.data;
          }
          return;
        }
      }

      // If the entry doesn't fit in any existing pages, handle new page creation logic here
      console.log('Deleted data:', this.groupedEntries);
    };
  }
  
}
