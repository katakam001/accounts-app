import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { YieldService } from '../../services/yield.service';
import { UnitService } from '../../services/unit.service';
import { ItemsService } from '../../services/items.service';
import { ConversionService } from '../../services/conversion.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-add-edit-yield-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule
  ],
  templateUrl: './add-edit-yield-dialog.component.html',
  styleUrls: ['./add-edit-yield-dialog.component.css']
})
export class AddEditYieldDialogComponent implements OnInit {
  yieldForm: FormGroup;
  userId: number;
  financialYear: string;
  units: any[] = [];
  items: any[] = [];
  conversions: any[] = [];
  availableConversions: any[][] = [];

  constructor(
    private fb: FormBuilder,
    private yieldService: YieldService,
    private unitService: UnitService,
    private itemsService: ItemsService,
    private conversionService: ConversionService,
    public dialogRef: MatDialogRef<AddEditYieldDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.yieldForm = this.fb.group({
      raw_item_id: ['', Validators.required],
      unit_id: ['', Validators.required],
      processedItems: this.fb.array([])
    });
    this.userId = data.userId;
    this.financialYear = data.financialYear;
  }

  ngOnInit(): void {
    this.fetchUnits();
    this.loadItems();
    this.loadConversions();
    if (this.data.yield) {
      this.yieldForm.patchValue({
        raw_item_id: this.data.yield.rawItem.id,
        unit_id: this.data.yield.rawItem.unit_id
      });
      this.setProcessedItems(this.data.yield.processedItems);
    }
  }

  fetchUnits(): void {
    this.unitService.getUnitsByUserIdAndFinancialYear(this.userId, this.financialYear).subscribe((data: any[]) => {
      this.units = data;
    });
  }

  loadItems(): void {
    this.itemsService.getItemsByUserIdAndFinancialYear(this.userId, this.financialYear).subscribe((data: any[]) => {
      this.items = data;
    });
  }

  loadConversions(): void {
    this.conversionService.getConversionsByUserIdAndFinancialYear(this.userId, this.financialYear).subscribe((data: any[]) => {
      this.conversions = data;
    });
  }

  get processedItems(): FormArray {
    return this.yieldForm.get('processedItems') as FormArray;
  }

  addProcessedItem(): void {
    this.processedItems.push(this.fb.group({
      item_id: ['', Validators.required],
      percentage: [0, Validators.required],
      unit_id: ['', Validators.required],
      conversion_id: ['']
    }));
    this.availableConversions.push([]);
  }

  removeProcessedItem(index: number): void {
    this.processedItems.removeAt(index);
    this.availableConversions.splice(index, 1);
  }

  setProcessedItems(items: any[]): void {
    items.forEach((item, index) => {
      this.processedItems.push(this.fb.group({
        item_id: [item.item_id, Validators.required],
        percentage: [item.percentage, Validators.required],
        unit_id: [item.unit_id, Validators.required],
        conversion_id: [item.conversion_id]
      }));
      this.updateAvailableConversions(index);
    });
  }

  updateAvailableConversions(index: number): void {
    const processedItem = this.processedItems.at(index);
    const rawItemId = this.yieldForm.get('unit_id')?.value;
    const processedUnitId = processedItem.get('unit_id')?.value;

    this.availableConversions[index] = this.conversions.filter(c => c.from_unit_id === rawItemId && c.to_unit_id === processedUnitId);
  }

  onSave(): void {
    if (this.yieldForm.valid) {
      const yieldData = {
        rawItem: {
          item_id: this.yieldForm.value.raw_item_id,
          unit_id: this.yieldForm.value.unit_id,
          user_id: this.userId,
          financial_year: this.financialYear
        },
        processedItems: this.yieldForm.value.processedItems,
      };
      if (this.data.yield) {
        this.yieldService.updateYield(this.data.yield.rawItem.id, yieldData).subscribe(() => {
          this.dialogRef.close(true);
        });
      } else {
        this.yieldService.createYield(yieldData).subscribe(() => {
          this.dialogRef.close(true);
        });
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
