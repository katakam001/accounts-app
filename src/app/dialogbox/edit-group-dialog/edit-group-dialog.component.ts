import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Group } from '../../models/group.interface';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-edit-group-dialog',
  imports: [MatCardModule,MatInputModule,ReactiveFormsModule,MatCardModule,MatIconModule,CommonModule,MatSelectModule,MatDatepickerModule],
  templateUrl: './edit-group-dialog.component.html',
  styleUrls: ['./edit-group-dialog.component.css']
})
export class EditGroupDialogComponent implements OnInit {
  editGroupForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<EditGroupDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
  ) {
    this.editGroupForm = this.fb.group({
      id: [this.data.group.id],
      name: [this.data.group.name, Validators.required],
      description: [this.data.group.description],
    });
  }

  ngOnInit(): void {}

  onSave(): void {
    if (this.editGroupForm.valid) {
      const formValue = this.editGroupForm.value;
      const updatedGroup: Group = {
        id: formValue.id,
        name: formValue.name,
        description: formValue.description,
        financial_year: this.data.financialYear,
        user_id: this.data.userId
      };
      this.dialogRef.close(updatedGroup);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

}
