import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { UnitService } from '../../services/unit.service';
import { AddEditUnitDialogComponent } from '../../dialogbox/add-edit-unit-dialog/add-edit-unit-dialog.component';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-units',
  imports: [MatTableModule, MatToolbarModule, MatInputModule, ReactiveFormsModule, MatCardModule, MatSelectModule, MatIconModule, CommonModule],
  templateUrl: './units.component.html',
  styleUrls: ['./units.component.css']
})
export class UnitsComponent implements OnInit {
  units: MatTableDataSource<any>;
  displayedColumns: string[] = ['name', 'actions'];

  constructor(private unitService: UnitService, public dialog: MatDialog) {
    this.units = new MatTableDataSource<any>([]);
  }

  ngOnInit(): void {
    this.fetchUnits();
  }

  fetchUnits(): void {
    this.unitService.getUnits().subscribe((data: any[]) => {
      this.units.data = data;
    });
  }

  openAddUnitDialog(): void {
    const dialogRef = this.dialog.open(AddEditUnitDialogComponent, {
      width: '400px',
      data: { unit: null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.fetchUnits();
      }
    });
  }

  openEditUnitDialog(unit: any): void {
    const dialogRef = this.dialog.open(AddEditUnitDialogComponent, {
      width: '400px',
      data: { unit }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.fetchUnits();
      }
    });
  }

  deleteUnit(unitId: number): void {
    this.unitService.deleteUnit(unitId).subscribe(() => {
      this.fetchUnits();
    });
  }
}
