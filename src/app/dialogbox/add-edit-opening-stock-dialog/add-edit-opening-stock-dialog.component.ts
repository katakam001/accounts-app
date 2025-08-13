import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { ItemsService } from '../../services/items.service';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-add-edit-opening-stock-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule
  ],
  templateUrl: './add-edit-opening-stock-dialog.component.html',
  styleUrls: ['./add-edit-opening-stock-dialog.component.css']
})
export class AddEditOpeningStockDialogComponent implements OnInit {
  stockForm: FormGroup;
  userId: number;
  financialYear: string;
  items: any[] = []; // Add items array

  constructor(
    private fb: FormBuilder,
    private itemsService: ItemsService, // Inject ItemService

    public dialogRef: MatDialogRef<AddEditOpeningStockDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.stockForm = this.fb.group({
      item_id: ['', Validators.required],
      quantity: [0, [Validators.required, Validators.min(1)]],
      rate: [0, [Validators.required, Validators.min(0)]],
      value: [0, [Validators.required, Validators.min(0)]]
    });

    this.userId = data.userId;
    this.financialYear = data.financialYear;
  }

  ngOnInit(): void {
    this.fetchItems();
    if (this.data.stock) {
      this.stockForm.patchValue(this.data.stock);
    }
  }

  onFieldChange(): void {
    const qty = this.stockForm.get('quantity')?.value;
    const rate = this.stockForm.get('rate')?.value;

    if (qty != null && rate != null && qty > 0 && rate >= 0) {
      const computed = parseFloat(qty.toString()) * parseFloat(rate.toString());
      this.stockForm.get('value')?.setValue(computed.toFixed(2), { emitEvent: false });
    } else {
      this.stockForm.get('value')?.setValue(0, { emitEvent: false });
    }
  }

  fetchItems(): void {
    this.itemsService.getItemsByUserIdAndFinancialYear(this.userId, this.financialYear).subscribe((data: any[]) => {
      this.items = data;
    });
  }

  onSave(): void {
    if (this.stockForm.valid) {
      const formValue = this.stockForm.value;
      const updatedStock = {
        id: this.data.stock?.id,
        item_id: formValue.item_id,
        quantity: formValue.quantity,
        rate: formValue.rate,
        value: formValue.value,
        user_id: this.userId,
        financial_year: this.financialYear
      };
      this.dialogRef.close(updatedStock);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
