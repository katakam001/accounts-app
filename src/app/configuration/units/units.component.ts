import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { UnitService } from '../../services/unit.service';
import { AddEditUnitDialogComponent } from '../../dialogbox/add-edit-unit-dialog/add-edit-unit-dialog.component';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { StorageService } from '../../services/storage.service';
import { FinancialYearService } from '../../services/financial-year.service';

@Component({
  selector: 'app-units',
  standalone: true,
  imports: [MatTableModule, MatToolbarModule, MatCardModule, MatIconModule, CommonModule, MatSortModule],
  templateUrl: './units.component.html',
  styleUrls: ['./units.component.css']
})
export class UnitsComponent implements OnInit {
  units: MatTableDataSource<any>;
  displayedColumns: string[] = ['name', 'actions'];
  financialYear: string;
  userId: number;

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private unitService: UnitService,
    public dialog: MatDialog,
    private storageService: StorageService,
    private financialYearService: FinancialYearService
  ) {
    this.units = new MatTableDataSource<any>([]);
  }

  ngOnInit(): void {
    this.userId = this.storageService.getUser().id;
    this.getFinancialYear();
  }

  getFinancialYear() {
    const storedFinancialYear = this.financialYearService.getStoredFinancialYear();
    if (storedFinancialYear) {
      this.financialYear = storedFinancialYear;
      this.fetchUnits(this.userId, this.financialYear);
    }
  }

  fetchUnits(userId: number, financialYear: string): void {
    this.unitService.getUnitsByUserIdAndFinancialYear(userId, financialYear).subscribe((data: any[]) => {
      this.units.data = data;
      this.units.sort = this.sort; // Set the sort after fetching the data
    });
  }

  openAddUnitDialog(): void {
    const dialogRef = this.dialog.open(AddEditUnitDialogComponent, {
      width: '400px',
      data: { unit: null, userId: this.userId, financialYear: this.financialYear }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.fetchUnits(this.userId, this.financialYear);
      }
    });
  }

  openEditUnitDialog(unit: any): void {
    const dialogRef = this.dialog.open(AddEditUnitDialogComponent, {
      width: '400px',
      data: { unit, userId: this.userId, financialYear: this.financialYear }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.fetchUnits(this.userId, this.financialYear);
      }
    });
  }

  deleteUnit(unitId: number): void {
    this.unitService.deleteUnit(unitId).subscribe(() => {
      this.fetchUnits(this.userId, this.financialYear);
    });
  }
}
