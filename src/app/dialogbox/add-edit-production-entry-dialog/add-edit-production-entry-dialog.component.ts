import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, AbstractControl, Validators } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductionService } from '../../services/production.service';
import { YieldService } from '../../services/yield.service';
import { ConversionService } from '../../services/conversion.service';
import { UnitService } from '../../services/unit.service';
import { DatePipe } from '@angular/common';
import { ItemsService } from '../../services/items.service';

@Component({
  selector: 'app-add-edit-production-entry-dialog',
  standalone: true,
  imports: [MatInputModule, ReactiveFormsModule, MatIconModule, CommonModule, MatSelectModule, MatDialogModule, MatDatepickerModule],
  templateUrl: './add-edit-production-entry-dialog.component.html',
  styleUrls: ['./add-edit-production-entry-dialog.component.css']
})
export class AddEditProductionEntryDialogComponent implements OnInit {
  productionEntryForm: FormGroup;
  yields: any[] = [];
  conversions: any[] = [];
  items: any[] = [];
  units: any[] = [];

  constructor(
    private fb: FormBuilder,
    private productionService: ProductionService,
    private yieldService: YieldService,
    private conversionService: ConversionService,
    private unitService: UnitService,
    private itemsService: ItemsService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<AddEditProductionEntryDialogComponent>,
    private datePipe: DatePipe, // Inject DatePipe
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.productionEntryForm = this.fb.group({
      raw_item_id: [this.data.entry ? this.data.entry.raw_item_id : '', Validators.required],
      production_date: [this.data.entry ? this.data.entry.production_date : '', Validators.required],
      quantity: [this.data.entry ? this.data.entry.quantity : '', Validators.required],
      unit_id: [this.data.entry ? this.data.entry.unit_id : '', Validators.required],
      processedItems: this.fb.array(this.data.entry ? this.data.entry.processedItems.map((item: any) => this.createProcessedItemGroup(item)) : [])
    });

    this.loadItems();
    this.fetchUnits();
    this.loadYields();
  }

  get processedItems(): FormArray {
    return this.productionEntryForm.get('processedItems') as FormArray;
  }

  createProcessedItemGroup(item: any): FormGroup {
    return this.fb.group({
      item_id: [item.item_id],
      item_name: [item.item_name],
      quantity: [item.quantity],
      unit_id: [item.unit_id],
      unit_name: [item.unit_name]
    });
  }

  addProcessedItem(): void {
    this.processedItems.push(this.createProcessedItemGroup({
      item_id: '',
      item_name: '',
      quantity: '',
      unit_id: '',
      unit_name: ''
    }));
  }

  removeProcessedItem(index: number): void {
    this.processedItems.removeAt(index);
  }

  loadYields(): void {
    const userId = this.data.userId;
    const financialYear = this.data.financialYear;
    this.yieldService.getYieldsByUserIdAndFinancialYear(userId, financialYear).subscribe((data: any[]) => {
      this.yields = data;
      this.loadConversions();
    });
  }

  loadConversions(): void {
    const userId = this.data.userId;
    const financialYear = this.data.financialYear;
    this.conversionService.getConversionsByUserIdAndFinancialYear(userId, financialYear).subscribe((conversions: any[]) => {
      this.conversions = conversions;
      this.yields.forEach(yieldData => {
        yieldData.processedItems.forEach((item: any) => {
          const conversion = conversions.find((c: any) => c.id === item.conversion_id);
          item.conversion = conversion ? {
            from_unit_name: conversion.from_unit_name,
            to_unit_name: conversion.to_unit_name,
            rate: conversion.rate
          } : null;
        });
      });
    });
  }

  calculateProcessedItems(): void {
    const rawItemId = this.productionEntryForm.get('raw_item_id')?.value;
    const yieldData = this.yields.find(yieldItem => yieldItem.rawItem.item_id === rawItemId);

    if (yieldData) {
      this.processedItems.clear();
      yieldData.processedItems.forEach((processedItem : any)=> {
        let quantity;
        if (processedItem.conversion) {
          quantity = this.productionEntryForm.get('quantity')?.value * processedItem.conversion.rate;
        } else {
          quantity = this.productionEntryForm.get('quantity')?.value * (processedItem.percentage / 100);
        }
        this.processedItems.push(this.createProcessedItemGroup({
          item_id: processedItem.item_id,
          item_name: processedItem.item_name,
          quantity: quantity,
          unit_id: processedItem.unit_id,
          unit_name: processedItem.unit_name
        }));
      });
    }
  }

  fetchUnits(): void {
    const userId = this.data.userId;
    const financialYear = this.data.financialYear;
    this.unitService.getUnitsByUserIdAndFinancialYear(userId, financialYear).subscribe((data: any[]) => {
      this.units = data;
    });
  }

  loadItems(): void {
    const userId = this.data.userId;
    const financialYear = this.data.financialYear;
    this.itemsService.getItemsByUserIdAndFinancialYear(userId, financialYear).subscribe((data: any[]) => {
      this.items = data;
    });
  }
  onSave(): void {
    if (this.productionEntryForm.valid) {
      const productionEntry = {
        ...this.productionEntryForm.value,
        financial_year: this.data.financialYear,
        user_id: this.data.userId,
        production_date: this.datePipe.transform(this.productionEntryForm.get('production_date')?.value, 'yyyy-MM-dd', 'en-IN') // Transform the date
      };

      this.dialogRef.close(productionEntry);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
