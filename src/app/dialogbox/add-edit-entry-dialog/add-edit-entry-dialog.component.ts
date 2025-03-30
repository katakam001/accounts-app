import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl, FormArray, AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CategoryService } from '../../services/category.service';
import { CommonModule, DatePipe } from '@angular/common';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CategoryUnitService } from '../../services/category-unit.service';
import { Account } from '../../models/account.interface';
import { AccountService } from '../../services/account.service';
import { EntryService } from '../../services/entry.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FieldMappingService } from '../../services/field-mapping.service';
import { BrokerService } from '../../services/broker.service';
import { AreaService } from '../../services/area.service';
import { ItemsService } from '../../services/items.service'; // Import ItemService
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { GroupNode } from '../../models/group-node.interface';
import { GroupMappingService } from '../../services/group-mapping.service';
import { SupplierFilterPipe } from "../../pipe/supplier-filter.pipe";

@Component({
  selector: 'app-add-edit-entry-dialog',
  standalone: true,
  imports: [MatInputModule,ReactiveFormsModule, MatSelectModule, CommonModule, MatDialogModule, MatDatepickerModule, MatIconModule,MatAutocompleteModule, SupplierFilterPipe],
  templateUrl: './add-edit-entry-dialog.component.html',
  styleUrls: ['./add-edit-entry-dialog.component.css']
})
export class AddEditEntryDialogComponent implements OnInit {
  entryForm: FormGroup;
  categories: any[] = [];
  dynamicFields: any[] = [];
  units: any[] = [];
  suppliers: Account[] = [];
  categoryAccount: Account[] = [];
  brokers: any[] = [];
  areas: any[] = [];
  items: any[] = []; // Add items array
  groupMapping: any[] = []; // Add fields array
  unitsMap: { [key: number]: any[] } = {}; // Store units for each categoryId
  taxAccountMap: Map<number, string> = new Map();
  gstNoMap: Map<number, string> = new Map();
  isSaving = false;
  constructor(
    private fb: FormBuilder,
    private entryService: EntryService,
    private categoryService: CategoryService,
    private fieldMappingService: FieldMappingService,
    private categoryUnitService: CategoryUnitService,
    private accountService: AccountService,
    private brokerService: BrokerService,
    private areaService: AreaService,
    private itemsService: ItemsService, // Inject ItemService
    private groupMappingService: GroupMappingService, // Inject FieldMappingService
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<AddEditEntryDialogComponent>,
    private route: ActivatedRoute, // Inject ActivatedRoute
    @Inject(MAT_DIALOG_DATA) public data: any,
    private datePipe: DatePipe
  ) {
    this.entryForm = this.fb.group({
      invoiceNumber: ['', Validators.required],
      invoice_seq_id: [''],
      gstNo: [''],
      entry_date: ['', Validators.required],
      account_id: ['', Validators.required],
      customerName: ['', Validators.required],
      entries: this.fb.array([this.createEntry()]), // Use FormArray for multiple entries
      groupEntryValue: [{ value: '', disabled: true }], // Update the form control name if needed
      groupTotalAmount: [{ value: '', disabled: true }]
    });
  }
  setAccountId(event: any): void {
    console.log(event);
    const selectedData = event.option.value;
    const supplierName = this.suppliers[selectedData.index].name;
    const gstNo = this.suppliers[selectedData.index].gst_no || '';
    this.entryForm.patchValue({ account_id: selectedData.id });
    this.entryForm.patchValue({ customerName: supplierName });
    this.entryForm.patchValue({ gstNo: gstNo });
  }

  get entries() {
    return this.entryForm.get('entries') as FormArray;
  }

  getDynamicFieldsControls(entry: AbstractControl): AbstractControl[] {
    const formArray = entry.get('dynamicFields') as FormArray;
    return formArray ? formArray.controls : [];
  }


  addEntry() {
    this.entries.push(this.createEntry());
    this.updateGroupValues(); // Update group values after adding a new entry
  }

  removeEntry(index: number) {
    this.entries.removeAt(index);
    this.updateGroupValues(); // Update group values after removing an entry
  }


  createEntry(): FormGroup {
    const entryGroup = this.fb.group({
      category_id: ['', Validators.required],
      item_id: ['', Validators.required],
      quantity: ['', [Validators.required, Validators.min(1)]],
      unit_id: ['', Validators.required],
      unit_price: ['', Validators.required],
      value: [{ value: '', disabled: true }],
      total_amount: [{ value: '', disabled: true }],
      category_account_id: ['', Validators.required],
      journal_id: [''],
      id: [''],
      dynamicFields: this.fb.array([]) // Handle dynamic fields within entries
    });
    return entryGroup;
  }

  ngOnInit(): void {
    if (this.data.invoice_seq_id) {
      // Component is activated via a route with an entryId parameter
      console.log("activated route");
      this.fetchEntry(this.data.invoice_seq_id,this.data.type);
    } else {
      console.log("edit flow");
      // Component is not activated via a route with an entryId parameter
      const categoryType = (this.data.type === 1 || this.data.type === 3 || this.data.type === 5) ? 1 : 2;
      this.fetchInitialData(categoryType).then(() => {
        if (this.data.group) {
          const entriesArray = this.fb.array([]);
          const categoryIds = new Set<number>();

          this.data.group.entries.forEach((e: any) => {
            const entryGroup = this.createEntry();
            entryGroup.patchValue(e);

            const dynamicFieldsArray = this.fb.array([]);
            e.dynamicFields.forEach((field: any) => {
              const fieldGroup = this.fb.group({
                field_id: [field.field_id],
                field_name: [field.field_name],
                field_value: [field.field_value],
                field_category: [field.field_category],
                exclude_from_total: [''],
                tax_account_id: [field.tax_account_id]
              });
              dynamicFieldsArray.push(fieldGroup as unknown as FormControl);
            });

            entryGroup.setControl('dynamicFields', dynamicFieldsArray);
            entriesArray.push(entryGroup as unknown as FormControl);

            // Collect unique categoryIds for fetching dynamic fields and units
            if (e.category_id) {
              categoryIds.add(e.category_id);
            }
          });
          this.entryForm.setControl('entries', entriesArray);
          this.entryForm.patchValue(this.data.group);

          categoryIds.forEach(categoryId => {
            this.onCategoryChange(categoryId);   
          });
          this.updateGroupValues();
        }
      });
    }
  }

  fetchEntry(invoice_seq_id: number,type:number): void {
    this.entryService.getEntriesByInvoiceSeqId(invoice_seq_id,type).subscribe((entry: any) => {
      console.log(entry);
      this.data.group=entry;
      this.entryForm.patchValue({
        invoice_seq_id: entry.invoice_seq_id,
        invoiceNumber: entry.invoiceNumber,
        entry_date: entry.entry_date,
        customerName: entry.customerName,
        account_id: entry.account_id,
      });

      const entriesArray = this.fb.array([]);
      const categoryIds = new Set<number>();

      entry.entries.forEach((e: any) => {
        const entryGroup = this.createEntry();
        entryGroup.patchValue(e);

        // Convert and add dynamic fields
        const dynamicFieldsArray = this.fb.array([]);
        e.fields.forEach((field: any) => {
          const fieldGroup = this.fb.group({
            field_id: [field.field_id],
            field_name: [field.field_name],
            field_value: [field.field_value],
            field_category: [''],
            exclude_from_total: [''],
            tax_account_id: ['']
          });
          dynamicFieldsArray.push(fieldGroup as unknown as FormControl);
        });

        entryGroup.setControl('dynamicFields', dynamicFieldsArray);
        entriesArray.push(entryGroup as unknown as FormControl);

        // Collect unique categoryIds for fetching dynamic fields and units
        if (e.category_id) {
          categoryIds.add(e.category_id);
        }
      });
      this.entryForm.setControl('entries', entriesArray);

      const categoryType = (entry.type === 1 || entry.type === 3 || entry.type === 5) ? 1 : 2;
      this.fetchInitialData(categoryType).then(() => {
        categoryIds.forEach(categoryId => {
          this.onCategoryChange(categoryId);   
        });
        console.log(this.gstNoMap);
        this.entryForm.patchValue({
          gstNo: this.gstNoMap.get(entry.account_id)
        });
      });

      // Trigger calculation of group values
      this.updateGroupValues();
    });
  }

  getGroupValueLabel(type: number): string {
    switch (type) {
      case 1: return 'Purchase Value';
      case 2: return 'Sale Value';
      case 3: return 'Return Value';
      case 4: return 'Return Value';
      case 5: return 'Credit Note Value';
      case 6: return 'Debit Note Value';
      default: return 'Group Value';
    }
  }


  dateFilter = (date: Date | null): boolean => {
    if (!date || !this.data.financialYear) {
      return false;
    }

    const [startYear, endYear] = this.data.financialYear.split('-').map(Number);
    const startDate = new Date(startYear, 3, 1);
    const endDate = new Date(endYear, 2, 31);
    return date >= startDate && date <= endDate;
  };

  fetchInitialData(categoryType: number): Promise<void> {
    return Promise.all([
      this.fetchCategories(categoryType),
      this.fetchSuppliers(),
      this.fetchBrokers(),
      this.fetchAreas(),
      this.fetchItems(), // Fetch items
      this.fetchAccountWithGroup(),
      this.fetchGroupMapping()
    ]).then(() => { });
  }

  fetchCategories(type: number): Promise<void> {
    return new Promise((resolve) => {
      this.categoryService.getCategoriesByType(this.data.userId, this.data.financialYear, type).subscribe((data: any[]) => {
        this.categories = data;
        resolve();
      });
    });
  }

  fetchSuppliers(): Promise<void> {
    return new Promise((resolve) => {
      this.accountService.getAccountsByUserIdAndFinancialYear(this.data.userId, this.data.financialYear, ['Sundry Creditors', 'Sundry Debtors']).subscribe((accounts: Account[]) => {
        this.suppliers = accounts;
        this.gstNoMap = new Map(accounts.map(account => [account.id, account.gst_no || '']));
        resolve();
      });
    });
  }

  fetchAccountWithGroup(): Promise<void> {
    const groupAccountMapping: { [key: number]: string } = {
      1: 'Purchase Account',
      2: 'Sale Account',
      3: 'Purchase Return Account',
      4: 'Sale Return Account',
      5: 'Credit Note Account',
      6: 'Debit Note Account'
    };

    // Get the group name based on this.data.type
    const groupName = groupAccountMapping[this.data.type];

    return new Promise((resolve) => {
      this.accountService.getAccountsByUserIdAndFinancialYear(this.data.userId, this.data.financialYear, [groupName]).subscribe((accounts: Account[]) => {
        this.categoryAccount = accounts;
        resolve();
      });
    });
  }

  fetchBrokers(): Promise<void> {
    return new Promise((resolve) => {
      this.brokerService.getBrokersByUserIdAndFinancialYear(this.data.userId, this.data.financialYear).subscribe((data: any[]) => {
        this.brokers = data;
        resolve();
      });
    });
  }

  fetchAreas(): Promise<void> {
    return new Promise((resolve) => {
      this.areaService.getAreasByUserIdAndFinancialYear(this.data.userId, this.data.financialYear).subscribe((data: any[]) => {
        this.areas = data;
        resolve();
      });
    });
  }

  fetchItems(): Promise<void> {
    return new Promise((resolve) => {
      this.itemsService.getItemsByUserIdAndFinancialYear(this.data.userId, this.data.financialYear).subscribe((data: any[]) => {
        this.items = data;
        resolve();
      });
    });
  }

  fetchGroupMapping(): Promise<void> {
    return new Promise((resolve) => {
      this.groupMappingService.getGroupMappingTree(this.data.userId, this.data.financialYear).subscribe(data => {
        this.groupMapping = data;
        const accountIds = this.getAccountIdsFromNodeByName('Indirect Expenses');
        this.fetchAccounts(accountIds);
        resolve();
      });
    });
  }
  fetchAccounts(accountIds: number[]): void {
    this.accountService.getAccountsByUserIdAndFinancialYear(this.data.userId, this.data.financialYear).subscribe((accounts: Account[]) => {
      const filteredAccounts = accounts.filter(account => accountIds.includes(account.id));
      this.taxAccountMap = new Map(filteredAccounts.map(account => [account.id, account.name]));
    });
  }

  onCategoryChange(categoryId: number): void {
    this.fetchDynamicFields(categoryId);
    this.fetchUnits(categoryId);
  }

  fetchDynamicFields(categoryId: number): void {
    this.fieldMappingService.getFieldMappingsByCategory(this.data.userId, this.data.financialYear, categoryId).subscribe((data: any[]) => {
      const excludeFields = (field: any) => !(field.field_category === 1 && field.exclude_from_total);
      const filteredFields = data.filter(field => {
        if (this.data.type === 3 && (this.data.isPurchaseReturn === undefined || this.data.isPurchaseReturn === false)) {
            return excludeFields(field);
        } else if (this.data.type === 2 || this.data.type === 4 || this.data.type === 5 || this.data.type === 6) {
          return excludeFields(field);
        }
        return true;
      });

      this.entries.controls.forEach((entry: AbstractControl) => {
        const entryGroup = entry as FormGroup;
        if (entryGroup.get('category_id')?.value === categoryId) {
          const dynamicFieldsArray = entryGroup.get('dynamicFields') as FormArray;
          // Collect all new FormGroup objects
          const newFieldGroups: FormGroup[] = [];

          filteredFields.forEach(field => {
            const entryField = entryGroup.value.dynamicFields?.find((f: any) => f.field_name === field.field_name);
            let defaultValue = entryField ? entryField.field_value : (field.field_type === 'number' ? 0 : '');
            if (['broker', 'Area'].includes(field.field_name)) {
              defaultValue = parseInt(defaultValue, 10);
            }
            const validators = field.required ? [Validators.required] : [];
            const fieldGroup = this.fb.group({
              field_id: [field.field_id],
              field_name: [field.field_name],
              field_value: [defaultValue],
              field_category: [field.field_category],
              exclude_from_total: [field.exclude_from_total],
              tax_account_id: [field.account_id]
            });

            // Apply validators to the 'field_value' control
            fieldGroup.get('field_value')?.setValidators(validators);
            if (this.data.group) {
              fieldGroup.controls['field_value'].setValue(defaultValue);
              fieldGroup.controls['exclude_from_total'].setValue(field.exclude_from_total);
            }
            newFieldGroups.push(fieldGroup);
          });
          // Clear existing dynamic fields
          dynamicFieldsArray.clear();

          // Add the new FormGroup objects to the dynamicFieldsArray
          newFieldGroups.forEach(newFieldGroup => {
            dynamicFieldsArray.push(newFieldGroup);
          });
        }
      });
    });
  }

  fetchUnits(categoryId: number): void {
    this.categoryUnitService.getUnitsByCategory(this.data.userId, this.data.financialYear, categoryId).subscribe((data: any[]) => {
      this.unitsMap[categoryId] = data;
    });
  }

  onQuantityChange(index: number): void {
    this.updateTotalAmount(this.entries.at(index) as FormGroup); // Update total amount when quantity changes
  }

  onUnitPriceChange(index: number): void {
    this.updateTotalAmount(this.entries.at(index) as FormGroup); // Update total amount when unit price changes
  }


  updateTotalAmount(entryGroup: FormGroup): void {
    let quantity = entryGroup.get('quantity')?.value || 0;
    let unit_price = entryGroup.get('unit_price')?.value || 0;

    // Ensure quantity has 4 decimals and unit_price has 2 decimals
    quantity = parseFloat(quantity).toFixed(4);
    unit_price = parseFloat(unit_price).toFixed(2);

    // Update the FormGroup with rounded values
    entryGroup.get('quantity')?.setValue(quantity, { emitEvent: false });
    entryGroup.get('unit_price')?.setValue(unit_price, { emitEvent: false });

    let amount = quantity * unit_price;
    amount = parseFloat((amount).toFixed(2));

    entryGroup.get('value')?.setValue(amount, { emitEvent: false });

    // Assuming GST and other calculations remain the same for each entry
    let gstAmount = 0;
    const gstValues: { [key: string]: number } = {};

    const gstFields = (entryGroup.get('dynamicFields') as FormArray).controls;
    gstFields.forEach((control: AbstractControl) => {
      const fieldGroup = control as FormGroup;
      const field_name = fieldGroup.get('field_name')?.value;
      const field_value = fieldGroup.get('field_value')?.value;
      const field_category = fieldGroup.get('field_category')?.value;
      const exclude_from_total = fieldGroup.get('exclude_from_total')?.value;

      if (field_category === 1) {
        const gstRateMatch = field_name.match(/(\d+(\.\d+)?)/);
        const gstRate = gstRateMatch ? parseFloat(gstRateMatch[1]) : 0;
        let gstValue = (amount * gstRate) / 100;
        gstValue = parseFloat((gstValue).toFixed(2));
        gstValues[field_name] = gstValue;

        if (!exclude_from_total) {
          gstAmount += gstValue;
        }
        fieldGroup.get('field_value')?.setValue(gstValue, { emitEvent: false });
      }
    });

    let totalAmount = amount + gstAmount;
    totalAmount = parseFloat((totalAmount).toFixed(2));
    entryGroup.get('total_amount')?.setValue(totalAmount, { emitEvent: false });

    entryGroup.patchValue(gstValues, { emitEvent: false });

    this.updateGroupValues(); // Call to update group totals whenever an entry total is updated
  }

  updateGroupValues(): void {
    console.log("update group total amount");
    const entries = this.entries.controls.map(entry => {
      // Temporarily enable the disabled fields
      entry.get('value')?.enable({ emitEvent: false });
      entry.get('total_amount')?.enable({ emitEvent: false });
  
      // Retrieve the entry values
      const entryValue = entry.get('value')?.value || 0;
      const totalAmount = entry.get('total_amount')?.value || 0;
  
      // Disable the fields again
      entry.get('value')?.disable({ emitEvent: false });
      entry.get('total_amount')?.disable({ emitEvent: false });
  
      return { value: entryValue, total_amount: totalAmount };
    });
  
    let groupEntryValue = 0;
    let groupTotalAmount = 0;
  
    entries.forEach(entry => {
      groupEntryValue += parseFloat(entry.value);
      groupTotalAmount += parseFloat(entry.total_amount);
    });
  
    this.entryForm.patchValue({
      groupEntryValue: parseFloat(groupEntryValue.toFixed(2)),
      groupTotalAmount: parseFloat(groupTotalAmount.toFixed(2))
    }, { emitEvent: false });
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
    if (node) {
      return this.extractAccountIds(node);
    } else {
      console.error('Node not found');
      return [];
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
    if (this.entryForm.valid) {
      this.isSaving = true;
      const formValues = this.entryForm.getRawValue();
      formValues.entry_date = this.datePipe.transform(formValues.entry_date, 'yyyy-MM-dd', 'en-IN');

      // Prepare entries data with their own dynamic fields
      const entriesData = formValues.entries.map((e: any, index: number) => {
        const dynamicFields = (this.entries.at(index).get('dynamicFields') as FormArray).controls.map((control: AbstractControl) => {
          const fieldGroup = control as FormGroup;
          return {
            field_id: fieldGroup.get('field_id')?.value,
            field_name: fieldGroup.get('field_name')?.value,
            field_value: fieldGroup.get('field_value')?.value,
            field_category: fieldGroup.get('field_category')?.value,
            exclude_from_total: fieldGroup.get('exclude_from_total')?.value,
            tax_account_id: fieldGroup.get('tax_account_id')?.value
          };
        });

        return {
          ...e,
          entry_date: formValues.entry_date,
          user_id: this.data.userId,
          customerName:formValues.customerName,
          type: this.data.type,
          financial_year: this.data.financialYear,
          invoice_seq_id:formValues.invoice_seq_id,
          invoiceNumber: formValues.invoiceNumber, // Include invoiceNumber
          account_id: formValues.account_id,       // Include account_id
          dynamicFields: dynamicFields // Include dynamic fields for each entry
        };
      });

      // Logic to handle adding/updating multiple entries
      if (this.data.group && (this.data.isPurchaseReturn || this.data.isSaleReturn)) {
        // Add new entries for Purchase Return (type 3) and Sale Return (type 4)
        this.entryService.addEntries(entriesData).subscribe(() => {
          this.isSaving = false;
          this.dialogRef.close(true);
        });
      } else if (this.data.group) {
        // Update existing entries for Purchase Entry (type 1), Sale Entry (type 2), Purchase Return (type 3), Sale Return (type 4), Credit Note (type 5), and Debit Note (type 6)
        this.entryService.updateEntries(entriesData).subscribe(() => {
          this.isSaving = false;
          this.dialogRef.close(true);
        });
      } else {
        // Add new entries for Purchase Entry (type 1), Sale Entry (type 2), Purchase Return (type 3), Sale Return (type 4), Credit Note (type 5), and Debit Note (type 6)
        this.entryService.addEntries(entriesData).subscribe(() => {
          this.isSaving = false;
          this.dialogRef.close(true);
        });
      }
    } else {
      this.identifyInvalidFields(this.entryForm);
      this.snackBar.open('Please fill all required fields.', 'Close', {
        duration: 3000,
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
