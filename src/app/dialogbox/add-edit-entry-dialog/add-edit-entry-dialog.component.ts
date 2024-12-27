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

  constructor(
    private fb: FormBuilder,
    private entryService: EntryService,
    private categoryService: CategoryService,
    private fieldMappingService: FieldMappingService,
    private categoryUnitService: CategoryUnitService,
    private accountService: AccountService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<AddEditEntryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private datePipe: DatePipe
  ) {
    this.entryForm = this.fb.group({
      category_id: ['', Validators.required],
      entry_date: ['', Validators.required],
      account_id: ['', Validators.required],
      item_description: [''],
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
    const categoryType = (this.data.type === 1 || this.data.type === 3) ? 1 : 2;
    this.fetchCategories(categoryType);
    this.fetchSuppliers();
    if (this.data.entry) {
      this.entryForm.patchValue(this.data.entry);
      this.onCategoryChange(this.data.entry.category_id);
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

  fetchCategories(type: number): void {
    this.categoryService.getCategoriesByType(type).subscribe((data: any[]) => {
      this.categories = data;
    });
  }

  fetchSuppliers(): void {
    this.accountService.getAccountsByUserIdAndFinancialYear(this.data.userId, this.data.financialYear, ['Sundary Creditors', 'Sundary Debtors']).subscribe((accounts: Account[]) => {
      this.suppliers = accounts;
    });
  }

  onCategoryChange(categoryId: number): void {
    this.fetchDynamicFields(categoryId);
    this.fetchUnits(categoryId);
  }

  fetchDynamicFields(categoryId: number): void {
    this.fieldMappingService.getFieldMappingsByCategory(categoryId).subscribe((data: any[]) => {
      if (this.data.type === 3 && !this.data.entry) {
        // Exclude fields with field_category === 1 and exclude_from_total for new purchase returns
        this.dynamicFields = data.filter(field => !(field.field_category === 1 && field.exclude_from_total));
      } else if (this.data.type === 2 || this.data.type === 4) {
        // Exclude fields with field_category === 1 and exclude_from_total for sale entries (type 2 and 4)
        this.dynamicFields = data.filter(field => !(field.field_category === 1 && field.exclude_from_total));
      } else {
        this.dynamicFields = data;
      }
      this.dynamicFields.forEach(field => {
        const entryField = this.data.entry?.fields.find((f: any) => f.field_name === field.field_name);
        const defaultValue = entryField ? entryField.field_value : (field.field_type === 'number' ? 0 : '');
        const validators = field.required ? [Validators.required] : [];
        this.entryForm.addControl(field.field_name, new FormControl(defaultValue, validators));
      });
    });
  }

  fetchUnits(categoryId: number): void {
    this.categoryUnitService.getUnitsByCategory(categoryId).subscribe((data: any[]) => {
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
  
      if (this.data.entry && (this.data.type === 1 || this.data.type === 2)) {
        // Update existing entry for Purchase Entry (type 1) and Sale Entry (type 2)
        this.entryService.updateEntry(this.data.entry.id, entry, dynamicFieldValues).subscribe(() => {
          this.dialogRef.close(true);
        });
      } else {
        // Add new entry for Purchase Return (type 3) and Sale Return (type 4)
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
