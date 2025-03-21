import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Group } from '../../models/group.interface';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-add-group-dialog',
  standalone: true,
  imports: [MatInputModule, ReactiveFormsModule, CommonModule],
  templateUrl: './add-group-dialog.component.html',
  styleUrls: ['./add-group-dialog.component.css']
})
export class AddGroupDialogComponent implements OnInit {
  addGroupForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<AddGroupDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder
  ) {
    this.addGroupForm = this.fb.group({
      name: ['', Validators.required],
      description: ['']
    });
  }

  ngOnInit(): void {}

  onSave(): void {
    if (this.addGroupForm.valid) {
      const formValue = this.addGroupForm.value;
      const newGroup: Group = {
        id: 0, // This will be set by the server
        name: formValue.name,
        description: formValue.description,
        financial_year: this.data.financialYear,
        user_id: this.data.userId
      };
      this.dialogRef.close(newGroup);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
