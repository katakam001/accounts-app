import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CategoryService } from '../../services/category.service';
import { FieldService } from '../../services/field.service';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CategoryUnitService } from '../../services/category-unit.service';
import { Account } from '../../models/account.interface';
import { AccountService } from '../../services/account.service';
import { EntryService } from '../../services/entry.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-add-edit-entry-dialog',
  imports: [MatCardModule, MatInputModule, ReactiveFormsModule, MatCardModule, MatIconModule, CommonModule, MatSelectModule, MatDialogModule, MatDatepickerModule],
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
    private fieldService: FieldService,
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
    this.fetchCategories();
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

  fetchCategories(): void {
    this.categoryService.getCategories().subscribe((data: any[]) => {
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
    this.fieldService.getFieldsByCategory(categoryId).subscribe((data: any[]) => {
      this.dynamicFields = data.filter(field => !(this.data.type === 2 && field.field_category === 1 && field.exclude_from_total));
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
        field_name: field.field_name,
        field_value: entry[field.field_name],
        field_category: field.field_category,
        exclude_from_total: field.exclude_from_total
      }));
      if (this.data.entry) {
        this.entryService.updateEntry(this.data.entry.id, entry, dynamicFieldValues).subscribe(() => {
          this.dialogRef.close(true);
        });
      } else {
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
