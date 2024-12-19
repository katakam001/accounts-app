import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort'; // Import MatSort and Sort
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
  imports: [MatTableModule, MatToolbarModule, MatInputModule, ReactiveFormsModule, MatCardModule, MatSelectModule, MatIconModule, CommonModule,MatSortModule],
  templateUrl: './purchase-fields.component.html',
  styleUrls: ['./purchase-fields.component.css']
})
export class PurchaseFieldsComponent implements OnInit {
  fields: MatTableDataSource<any>;
  displayedColumns: string[] = ['category_name', 'field_name', 'field_type', 'field_category', 'exclude_from_total', 'required', 'actions'];

  @ViewChild(MatSort) sort: MatSort; // ViewChild to get MatSort instance

  constructor(private fieldService: FieldService, public dialog: MatDialog) {
    this.fields = new MatTableDataSource<any>([]);
  }

  ngOnInit(): void {
    this.fetchFields();
  }

  fetchFields(): void {
    this.fieldService.getAllFields().subscribe((data: any[]) => {
      this.fields.data = data;
      this.fields.sort = this.sort; // Set MatSort instance to the data source
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

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.fields.filter = filterValue.trim().toLowerCase();
  }
}
