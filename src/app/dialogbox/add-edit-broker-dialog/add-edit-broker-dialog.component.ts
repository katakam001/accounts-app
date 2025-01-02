import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { BrokerService } from '../../services/broker.service';

@Component({
  selector: 'app-add-edit-broker-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './add-edit-broker-dialog.component.html',
  styleUrls: ['./add-edit-broker-dialog.component.css']
})
export class AddEditBrokerDialogComponent implements OnInit {
  brokerForm: FormGroup;
  userId: number;
  financialYear: string;

  constructor(
    private fb: FormBuilder,
    private brokerService: BrokerService,
    public dialogRef: MatDialogRef<AddEditBrokerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.brokerForm = this.fb.group({
      name: ['', Validators.required],
      contact: ['', Validators.required],
      email: [null, [ Validators.email]]
    });
    this.userId = data.userId;
    this.financialYear = data.financialYear;
  }

  ngOnInit(): void {
    if (this.data.broker) {
      this.brokerForm.patchValue(this.data.broker);
    }
  }

  onSave(): void {
    if (this.brokerForm.valid) {
      const broker = {
        ...this.brokerForm.value,
        user_id: this.userId,
        financial_year: this.financialYear
      };
      if (this.data.broker) {
        this.brokerService.updateBroker(this.data.broker.id, broker).subscribe(() => {
          this.dialogRef.close(true);
        });
      } else {
        this.brokerService.addBroker(broker).subscribe(() => {
          this.dialogRef.close(true);
        });
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
