import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { AddEditFieldDialogComponent } from '../../dialogbox/add-edit-field-dialog/add-edit-field-dialog.component';
import { FieldService } from '../../services/field.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-purchase-fields',
  imports: [MatTableModule, MatToolbarModule, MatInputModule, ReactiveFormsModule, MatCardModule, MatSelectModule, MatIconModule, CommonModule],
  templateUrl: './purchase-fields.component.html',
  styleUrls: ['./purchase-fields.component.css']
})
export class PurchaseFieldsComponent implements OnInit {
  fields: MatTableDataSource<any>;
  displayedColumns: string[] = ['category_name','field_name', 'field_type', 'required', 'actions'];

  constructor(private fieldService: FieldService, public dialog: MatDialog) {
    this.fields = new MatTableDataSource<any>([]);
  }

  ngOnInit(): void {
    this.fetchFields();
  }

  fetchFields(): void {
    this.fieldService.getFields().subscribe((data: any[]) => {
      this.fields.data = data;
    });
  }

  openAddFieldDialog(): void {
    const dialogRef = this.dialog.open(AddEditFieldDialogComponent, {
      width: '400px',
      data: { field: null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.fetchFields();
      }
    });
  }

  openEditFieldDialog(field: any): void {
    const dialogRef = this.dialog.open(AddEditFieldDialogComponent, {
      width: '400px',
      data: { field }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.fetchFields();
      }
    });
  }

  deleteField(fieldId: number): void {
    this.fieldService.deleteField(fieldId).subscribe(() => {
      this.fetchFields();
    });
  }
}
