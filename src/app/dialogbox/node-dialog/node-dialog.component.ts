import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { NodeDialogData } from '../../models/node-dialog-data.interface';

@Component({
  selector: 'app-node-dialog',
  templateUrl: './node-dialog.component.html',
  styleUrls: ['./node-dialog.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ]
})
export class NodeDialogComponent implements OnInit {
  nodeForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<NodeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: NodeDialogData,
    private fb: FormBuilder
  ) {
    this.nodeForm = this.fb.group({
      name: [data.name || ''],
      parentName: [data.parentName || '']
    });
  }

  ngOnInit(): void {}

  onSave(): void {
    this.dialogRef.close(this.nodeForm.value);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
