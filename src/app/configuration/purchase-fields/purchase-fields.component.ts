import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FieldMappingService } from '../../services/field-mapping.service';
import { AddEditFieldMappingDialogComponent } from '../../dialogbox/add-edit-field-mapping-dialog/add-edit-field-mapping-dialog.component';
import { FinancialYearService } from '../../services/financial-year.service';
import { StorageService } from '../../services/storage.service';
import { GroupNode } from '../../models/group-node.interface';
import { Account } from '../../models/account.interface';
import { GroupMappingService } from '../../services/group-mapping.service';
import { AccountService } from '../../services/account.service';

@Component({
  selector: 'app-purchase-fields',
  standalone: true,
  imports: [
    MatTableModule,
    MatToolbarModule,
    MatCardModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatIconModule,
    FormsModule,
    CommonModule,
    MatSortModule
  ],
  templateUrl: './purchase-fields.component.html',
  styleUrls: ['./purchase-fields.component.css']
})
export class PurchaseFieldsComponent implements OnInit {
  fields: MatTableDataSource<any>;
  displayedColumns: string[] = ['category_name', 'field_name', 'field_type', 'field_category', 'exclude_from_total','account_name', 'required', 'actions'];
  categories: string[] = [];
  fieldTypes: string[] = [];
  fieldCategories: string[] = ['Tax', 'Normal'];
  selectedCategory: string = '';
  selectedFieldType: string = '';
  selectedFieldCategory: string = '';
  excludeFromTotal: boolean = false;
  mandatory: boolean = false;
  originalData: any[] = [];
  userId: number;
  financialYear: string;
    groupMapping: any[] = []; // Add fields array
    accounts: Account[] = [];

  @ViewChild(MatSort) sort: MatSort;
  accountMap: Map<number, string> = new Map();

  constructor(
    private fieldMappingService: FieldMappingService,
    private financialYearService: FinancialYearService,
    private groupMappingService: GroupMappingService, // Inject FieldMappingService
    private accountService: AccountService,
    private storageService: StorageService,
    public dialog: MatDialog
  ) {
    this.fields = new MatTableDataSource<any>([]);
  }

  ngOnInit(): void {
    this.userId = this.storageService.getUser().id;
    this.getFinancialYear();
  }

  getFinancialYear() {
    const storedFinancialYear = this.financialYearService.getStoredFinancialYear();
    if (storedFinancialYear) {
      this.financialYear = storedFinancialYear;
      this.fetchGroupMapping();
    }
  }


  fetchFields(): void {
    this.fieldMappingService.getFieldMappingsByUserIdAndFinancialYear(this.userId, this.financialYear).subscribe((data: any[]) => {
      this.originalData =this.updateFieldsWithAccountName(data);
      this.fields.data = this.originalData;
      this.fields.sort = this.sort; // Set the sort after fetching the data
      this.extractFilterOptions(this.originalData);
    });
  }
  updateFieldsWithAccountName(data: any[]): any[] {
    data.forEach(field => {
      field.account_name = this.accountMap.get(field.account_id) || '';
    });
    console.log(data);
    return data;
  }
  fetchGroupMapping(): void {
    this.groupMappingService.getGroupMappingTree(this.userId, this.financialYear).subscribe(data => {
      this.groupMapping = data;
      const accountIds = this.getAccountIdsFromNodeByName('Indirect Expenses');
      this.fetchAccounts(accountIds);
      console.log('Accounts:', accountIds);
    });
  }
  fetchAccounts(accountIds: number[]): void {
    this.accountService.getAccountsByUserIdAndFinancialYear(this.userId, this.financialYear).subscribe((accounts: Account[]) => {
      const filteredAccounts = accounts.filter(account => accountIds.includes(account.id));
      this.accountMap = new Map(filteredAccounts.map(account => [account.id, account.name]));
      this.fetchFields();
    });
  }

  extractFilterOptions(data: any[]): void {
    this.categories = [...new Set(data.map(field => field.category_name))];
    this.fieldTypes = [...new Set(data.map(field => field.field_type))];
  }

  applyFilter(): void {
    let filteredData = this.originalData;

    if (this.selectedCategory) {
      filteredData = filteredData.filter(field => field.category_name === this.selectedCategory);
    }

    if (this.selectedFieldType) {
      filteredData = filteredData.filter(field => field.field_type === this.selectedFieldType);
    }

    if (this.selectedFieldCategory) {
      filteredData = filteredData.filter(field => field.field_category === (this.selectedFieldCategory === 'Tax' ? 1 : 0));
    }

    if (this.excludeFromTotal) {
      filteredData = filteredData.filter(field => field.exclude_from_total);
    }

    if (this.mandatory) {
      filteredData = filteredData.filter(field => field.required);
    }

    this.fields.data = filteredData;
  }

  resetFilters(): void {
    this.selectedCategory = '';
    this.selectedFieldType = '';
    this.selectedFieldCategory = '';
    this.excludeFromTotal = false;
    this.mandatory = false;
    this.fields.data = this.originalData;
  }

  openAddFieldDialog(): void {
    const dialogRef = this.dialog.open(AddEditFieldMappingDialogComponent, {
      width: '400px',
      data: { field: null, userId: this.userId, financialYear: this.financialYear }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
              // Add the new field to the original data
              result.account_name = this.accountMap.get(result.account_id) || '';
      this.originalData = [...this.originalData, result];
      this.applyFilter(); // Reapply filters to update the displayed data
      }
    });
  }

  openEditFieldDialog(field: any): void {
    const dialogRef = this.dialog.open(AddEditFieldMappingDialogComponent, {
      width: '400px',
      data: { field, userId: this.userId, financialYear: this.financialYear }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log(this.originalData);
        result.account_name = this.accountMap.get(result.account_id) || '';
              // Update the existing field in the original data
      this.originalData = this.originalData.map(f => f.id === result.id ? result : f);
      console.log(this.originalData);
      this.applyFilter(); // Reapply filters to update the displayed data
      }
    });
  }

  deleteField(fieldId: number): void {
    this.fieldMappingService.deleteFieldMapping(fieldId).subscribe(() => {
          // Remove the field from the original data
    this.originalData = this.originalData.filter(f => f.id !== fieldId);
    this.applyFilter(); // Reapply filters to update the displayed data
    });
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
}
