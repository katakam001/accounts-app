import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CategoryService } from '../../services/category.service';
import { FieldService } from '../../services/field.service';
import { UnitService } from '../../services/unit.service';
import { AccountService } from '../../services/account.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CategoryUnitService } from '../../services/category-unit.service';
import { Account } from '../../models/account.interface';
import { EntryService } from '../../services/entry.service';

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
    public dialogRef: MatDialogRef<AddEditEntryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.entryForm = this.fb.group({
      category_id: ['', Validators.required],
      purchase_date: ['', Validators.required],
      account_id: ['', Validators.required],
      item_description: [''],
      quantity: [null, Validators.min(0)],
      unit_id: ['', Validators.required],
      unit_price: [null, Validators.min(0)],
      total_amount: [{ value: null, disabled: true }],
      user_id: [this.data.userId],
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
    this.entryForm.valueChanges.subscribe(() => {
      this.updateTotalAmount();
    });
  }

  fetchCategories(): void {
    this.categoryService.getCategories().subscribe((data: any[]) => {
      this.categories = data;
    });
  }

  fetchSuppliers(): void {
    this.accountService.getAccountsByUserIdAndFinancialYear(this.data.userId,this.data.financialYear,['Sundary Creditors', 'Sundary Debtors']).subscribe((accounts: Account[]) => {
      this.suppliers = accounts;
    });
  }

  onCategoryChange(categoryId: number): void {
    this.fetchDynamicFields(categoryId);
    this.fetchUnits(categoryId);
  }

  fetchDynamicFields(categoryId: number): void {
    this.fieldService.getFieldsByCategory(categoryId).subscribe((data: any[]) => {
      this.dynamicFields = data;
      this.dynamicFields.forEach(field => {
        this.entryForm.addControl(field.field_name, new FormControl(''));
      });
    });
  }

  fetchUnits(categoryId: number): void {
    this.categoryUnitService.getUnitsByCategory(categoryId).subscribe((data: any[]) => {
      this.units = data;
    });
  }

  updateTotalAmount(): void {
    const quantity = this.entryForm.get('quantity')?.value || 0;
    const unit_price = this.entryForm.get('unit_price')?.value || 0;
    this.entryForm.get('total_amount')?.setValue(quantity * unit_price, { emitEvent: false });
  }

  onSave(): void {
    if (this.entryForm.valid) {
      const entry = this.entryForm.getRawValue();
      console.log(entry);
      const dynamicFieldValues = this.dynamicFields.map(field => ({
        field_name: field.field_name,
        field_value: entry[field.field_name]
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
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
