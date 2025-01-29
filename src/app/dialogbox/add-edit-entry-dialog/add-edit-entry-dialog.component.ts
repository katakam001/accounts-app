import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl, ReactiveFormsModule } from '@angular/forms';
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

@Component({
  selector: 'app-add-edit-entry-dialog',
  standalone: true,
  imports: [MatInputModule, ReactiveFormsModule, MatSelectModule, CommonModule, MatDialogModule, MatDatepickerModule],
  templateUrl: './add-edit-entry-dialog.component.html',
  styleUrls: ['./add-edit-entry-dialog.component.css']
})
export class AddEditEntryDialogComponent implements OnInit {
  entryForm: FormGroup;
  categories: any[] = [];
  dynamicFields: any[] = [];
  units: any[] = [];
  suppliers: Account[] = [];
  brokers: any[] = [];
  areas: any[] = [];
  items: any[] = []; // Add items array

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
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<AddEditEntryDialogComponent>,
    private route: ActivatedRoute, // Inject ActivatedRoute
    @Inject(MAT_DIALOG_DATA) public data: any,
    private datePipe: DatePipe
  ) {
    this.entryForm = this.fb.group({
      category_id: ['', Validators.required],
      entry_date: ['', Validators.required],
      account_id: ['', Validators.required],
      item_id: ['', Validators.required], // Replace item_description with item_id
      quantity: [null, Validators.min(0)],
      unit_id: ['', Validators.required],
      unit_price: [null, Validators.min(0)],
      value: [{ value: null, disabled: true }],
      total_amount: [{ value: null, disabled: true }],
      user_id: [this.data.userId],
      type: [this.data.type || 1, Validators.required],
      journal_id: [this.data.journal_id],
      financial_year: [this.data.financialYear],
    });
  }

  ngOnInit(): void {
 
      if (this.data.entryId) {
        // Component is activated via a route with an entryId parameter
        this.fetchEntry(this.data.entryId);
      } else {
        // Component is not activated via a route with an entryId parameter
        const categoryType = (this.data.type === 1 || this.data.type === 3 || this.data.type === 5) ? 1 : 2;
        this.fetchInitialData(categoryType).then(() => {
          if (this.data.entry) {
            this.entryForm.patchValue(this.data.entry);
            this.onCategoryChange(this.data.entry.category_id);
          }
        });
      }
  }
  
  fetchEntry(entryId: number): void {
    // Fetch the entry by ID and initialize the form
    // Assuming you have a service method to fetch the entry by ID
    this.entryService.getEntryById(entryId).subscribe((entry: any) => {
      this.entryForm.patchValue(entry);
      const convertedObject = {
        ...entry,
        dynamicFields: [...entry.fields]
      };
      this.data.entry = convertedObject
      console.log(entry.type);
      const categoryType = (entry.type === 1 || entry.type === 3 || entry.type === 5) ? 1 : 2;
      console.log(categoryType);
      this.fetchInitialData(categoryType).then(() => {
        console.log(entry.category_id);
        this.onCategoryChange(entry.category_id);
      });
    });
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
      this.fetchItems() // Fetch items
    ]).then(() => {});
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
      this.accountService.getAccountsByUserIdAndFinancialYear(this.data.userId, this.data.financialYear, ['Sundary Creditors', 'Sundary Debtors']).subscribe((accounts: Account[]) => {
        this.suppliers = accounts;
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

  onCategoryChange(categoryId: number): void {
    this.fetchDynamicFields(categoryId);
    this.fetchUnits(categoryId);
  }

  fetchDynamicFields(categoryId: number): void {
    console.log(categoryId);
    this.fieldMappingService.getFieldMappingsByCategory(this.data.userId, this.data.financialYear, categoryId).subscribe((data: any[]) => {
      const excludeFields = (field: any) => !(field.field_category === 1 && field.exclude_from_total);
      this.dynamicFields = data.filter(field => {
        if (this.data.type === 3 && !this.data.entry) {
          return excludeFields(field);
        } else if (this.data.type === 2 || this.data.type === 4 || this.data.type === 5|| this.data.type === 6) {
          return excludeFields(field);
        }
        return true;
      });

      this.dynamicFields.forEach(field => {
        const entryField = this.data.entry?.fields.find((f: any) => f.field_name === field.field_name);
        let defaultValue = entryField ? entryField.field_value : (field.field_type === 'number' ? 0 : '');
        if (['broker', 'Area'].includes(field.field_name)) {
          defaultValue = parseInt(defaultValue, 10);
        }
        const validators = field.required ? [Validators.required] : [];
        this.entryForm.addControl(field.field_name, new FormControl(defaultValue, validators));
      });
    });
}

  fetchUnits(categoryId: number): void {
    this.categoryUnitService.getUnitsByCategory(this.data.userId, this.data.financialYear, categoryId).subscribe((data: any[]) => {
      this.units = data;
    });
  }

  onQuantityChange(): void {
    this.updateTotalAmount();
  }

  onUnitPriceChange(): void {
    this.updateTotalAmount();
  }

  updateTotalAmount(): void {
    const quantity = this.entryForm.get('quantity')?.value || 0;
    const unit_price = this.entryForm.get('unit_price')?.value || 0;
    const amount = quantity * unit_price;
    this.entryForm.get('value')?.setValue(amount, { emitEvent: false });

    let gstAmount = 0;
    const gstValues: { [key: string]: number } = {};

    this.dynamicFields.forEach(field => {
      if (field.field_category === 1) {
        const gstRateMatch = field.field_name.match(/(\d+(\.\d+)?)/);
        const gstRate = gstRateMatch ? parseFloat(gstRateMatch[1]) : 0;
        const gstValue = (amount * gstRate) / 100;
        gstValues[field.field_name] = gstValue;

        if (!field.exclude_from_total) {
          gstAmount += gstValue;
        }
      }
    });

    const totalAmount = amount + gstAmount;
    this.entryForm.get('total_amount')?.setValue(totalAmount, { emitEvent: false });

    this.entryForm.patchValue(gstValues, { emitEvent: false });
  }

  onSave(): void {
    if (this.entryForm.valid) {
      const entry = this.entryForm.getRawValue();
      entry.entry_date = this.datePipe.transform(entry.entry_date, 'yyyy-MM-dd', 'en-IN');
      const dynamicFieldValues = this.dynamicFields.map(field => ({
        field_id: field.field_id,
        field_name: field.field_name,
        field_value: entry[field.field_name],
        field_category: field.field_category,
        exclude_from_total: field.exclude_from_total
      }));
  
      if (this.data.entry && (this.data.isPurchaseReturn || this.data.isSaleReturn)) {
        // Add new entry for Purchase Return (type 3) and Sale Return (type 4)
        this.entryService.addEntry(entry, dynamicFieldValues).subscribe(() => {
          this.dialogRef.close(true);
        });
      } else if (this.data.entry) {
        // Update existing entry for Purchase Entry (type 1), Sale Entry (type 2),Purchase Return (type 3), Sale Return (type 4), Credit Note (type 5), and Debit Note (type 6)
        this.entryService.updateEntry(this.data.entry.id, entry, dynamicFieldValues).subscribe(() => {
          this.dialogRef.close(true);
        });
      } else {
        // Add new entry for Purchase Entry (type 1), Sale Entry (type 2),Purchase Return (type 3), Sale Return (type 4), Credit Note (type 5), and Debit Note (type 6)
        this.entryService.addEntry(entry, dynamicFieldValues).subscribe(() => {
          this.dialogRef.close(true);
        });
      }
    } else {
      this.snackBar.open('Please fill all required fields.', 'Close', {
        duration: 3000,
      });
    }
  }
    

  onCancel(): void {
    this.dialogRef.close();
  }
}
