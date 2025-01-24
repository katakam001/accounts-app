import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { ItemsService } from '../../services/items.service';

@Component({
  selector: 'app-add-edit-item-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './add-edit-item-dialog.component.html',
  styleUrls: ['./add-edit-item-dialog.component.css']
})
export class AddEditItemDialogComponent implements OnInit {
  itemForm: FormGroup;
  userId: number;
  financialYear: string;

  constructor(
    private fb: FormBuilder,
    private itemsService: ItemsService,
    public dialogRef: MatDialogRef<AddEditItemDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.itemForm = this.fb.group({
      name: ['', Validators.required]
    });
    this.userId = data.userId;
    this.financialYear = data.financialYear;
  }

  ngOnInit(): void {
    if (this.data.item) {
      this.itemForm.patchValue(this.data.item);
    }
  }

  onSave(): void {
    if (this.itemForm.valid) {
      const item = {
        ...this.itemForm.value,
        user_id: this.userId,
        financial_year: this.financialYear
      };
      if (this.data.item) {
        this.itemsService.editItem(this.data.item.id, item).subscribe(() => {
          this.dialogRef.close(true);
        });
      } else {
        this.itemsService.addItem(item).subscribe(() => {
          this.dialogRef.close(true);
        });
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
