import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { FieldService } from '../../services/field.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { AddEditFieldDialogComponent } from '../../dialogbox/add-edit-field-dialog/add-edit-field-dialog.component';

@Component({
  selector: 'app-fields',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatCardModule
  ],
  templateUrl: './fields.component.html',
  styleUrls: ['./fields.component.css']
})
export class FieldsComponent implements OnInit {
  displayedColumns: string[] = ['field_name', 'actions'];
  dataSource: MatTableDataSource<any>;

  @ViewChild(MatSort) sort: MatSort;

  constructor(private fieldService: FieldService, public dialog: MatDialog) {}

  ngOnInit(): void {
    this.loadFields();
  }

  loadFields(): void {
    this.fieldService.getAllFields().subscribe((data: any[]) => {
      this.dataSource = new MatTableDataSource(data);
      this.dataSource.sort = this.sort;
    });
  }

  addField(): void {
    const dialogRef = this.dialog.open(AddEditFieldDialogComponent, {
      width: '400px',
      data: { field: null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadFields();
      }
    });
  }

  editField(field: any): void {
    const dialogRef = this.dialog.open(AddEditFieldDialogComponent, {
      width: '400px',
      data: { field }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadFields();
      }
    });
  }

  deleteField(fieldId: number): void {
    this.fieldService.deleteField(fieldId).subscribe(() => {
      this.loadFields();
    });
  }
}
