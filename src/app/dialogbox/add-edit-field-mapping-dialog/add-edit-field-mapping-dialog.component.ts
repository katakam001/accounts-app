import { Component, Inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CategoryService } from '../../services/category.service';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FieldService } from '../../services/field.service'; // Updated import
import { FieldMappingService } from '../../services/field-mapping.service'; // Import FieldMappingService
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar'; // Import MatSnackBar
import { GroupMappingService } from '../../services/group-mapping.service';
import { GroupNode } from '../../models/group-node.interface';
import { AccountService } from '../../services/account.service';
import { Account } from '../../models/account.interface';

@Component({
  selector: 'app-add-edit-field-mapping-dialog',
  standalone: true,
  imports: [
    MatInputModule,
    ReactiveFormsModule,
    CommonModule,
    MatSelectModule,
    MatDialogModule,
    MatCheckboxModule
  ],
  templateUrl: './add-edit-field-mapping-dialog.component.html',
  styleUrls: ['./add-edit-field-mapping-dialog.component.css']
})
export class AddEditFieldMappingDialogComponent implements OnInit {
  fieldForm: FormGroup;
  categories: any[] = [];
  fields: any[] = []; // Add fields array
  groupMapping: any[] = []; // Add fields array
  accounts: Account[] = [];
  accountsMap: { [key: number]: Account[] } = {}; // Store units for each categoryId
  userId: number;
  financialYear: string;
  showAccountField: boolean = false;
  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private fieldService: FieldService, // Updated service
    private fieldMappingService: FieldMappingService, // Inject FieldMappingService
    private groupMappingService: GroupMappingService, // Inject FieldMappingService
    private accountService: AccountService,
    private snackBar: MatSnackBar, // Inject MatSnackBar
    public dialogRef: MatDialogRef<AddEditFieldMappingDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.fieldForm = this.fb.group({
      category_id: ['', Validators.required],
      field_id: ['', Validators.required], // Updated to field_id
      field_type: ['', Validators.required],
      field_category: [0, Validators.required], // Default to Normal
      account_id: [null],
      exclude_from_total: [false],
      required: [false],
      type: [1]
    });
    this.userId = data.userId;
    this.financialYear = data.financialYear;
  }

  ngOnInit(): void {
    this.fetchCategories();
    this.fetchFields(); // Fetch fields on initialization
    this.fetchGroupMapping();
    if (this.data.field) {
      this.fieldForm.patchValue(this.data.field);
      this.setFieldCategoryDisplayValue();
    }
  }

  fetchCategories(): void {
    this.categoryService.getCategoriesByUserIdAndFinancialYear(this.userId, this.financialYear).subscribe((data: any[]) => {
      this.categories = data;
    });
  }

  fetchFields(): void {
    this.fieldService.getAllFieldsByUserIdAndFinancialYear(this.userId, this.financialYear).subscribe((data: any[]) => {
      this.fields = data;
    });
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
      this.accounts = accounts.filter(account => accountIds.includes(account.id));
    });
  }

  onFieldCategoryChange(event: any): void {
    this.showAccountField = event.value === 1; // Show account field only if field_category is 'Tax'
  }

  setFieldCategoryDisplayValue(): void {
    const fieldCategory = this.fieldForm.get('field_category')?.value;
    if (fieldCategory === 0) {
      this.fieldForm.get('field_category')?.setValue(0); // Normal
    } else if (fieldCategory === 1) {
      this.fieldForm.get('field_category')?.setValue(1); // Tax
    }
  }
  identifyInvalidFields(form: FormGroup): void {
    Object.keys(form.controls).forEach(field => {
      const control = form.get(field);
      if (control instanceof FormControl) {
        if (control.invalid) {
          console.log(`Invalid Field: ${field}, Error: ${JSON.stringify(control.errors)}`);
        }
      } else if (control instanceof FormGroup || control instanceof FormArray) {
        this.identifyInvalidFields(control as FormGroup);
      }
    });
  }
  onSave(): void {
    console.log(this.fieldForm.valid);
    if (this.fieldForm.valid) {
      const field = {
        ...this.fieldForm.value,
        user_id: this.userId,
        financial_year: this.financialYear
      };
      if (this.data.field) {
        this.fieldMappingService.updateFieldMapping(this.data.field.id, field).subscribe((response) => {
          this.dialogRef.close(response);
        });
      } else {
        this.fieldMappingService.addFieldMapping(field).subscribe((response) => {
          this.dialogRef.close(response);
        });
      }
    } else {
      this.identifyInvalidFields(this.fieldForm);
      this.snackBar.open('Please fill all required fields.', 'Close', {
        duration: 3000,
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onExcludeFromTotalChange(): void {
    if (this.fieldForm.get('exclude_from_total')?.value && this.fieldForm.get('field_category')?.value !== 1) {
      this.snackBar.open('Only tax fields can be excluded from the total amount.', 'Close', {
        duration: 3000,
      });
      this.fieldForm.get('exclude_from_total')?.setValue(false);
    }
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
