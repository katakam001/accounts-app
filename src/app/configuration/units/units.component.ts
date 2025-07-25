import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule, SortDirection } from '@angular/material/sort';
import { UnitService } from '../../services/unit.service';
import { AddEditUnitDialogComponent } from '../../dialogbox/add-edit-unit-dialog/add-edit-unit-dialog.component';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { StorageService } from '../../services/storage.service';
import { FinancialYearService } from '../../services/financial-year.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-units',
  standalone: true,
  imports: [MatTableModule, MatToolbarModule, MatCardModule, MatIconModule, CommonModule, MatSortModule],
  templateUrl: './units.component.html',
  styleUrls: ['./units.component.css']
})
export class UnitsComponent implements OnInit, AfterViewInit {
  units = new MatTableDataSource<any>();
  displayedColumns: string[] = ['name', 'actions'];
  financialYear: string;
  userId: number;

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private unitService: UnitService,
    public dialog: MatDialog,
    private storageService: StorageService,
    private snackBar: MatSnackBar,
    private financialYearService: FinancialYearService
  ) {
  }

  ngOnInit(): void {
    this.userId = this.storageService.getUser().id;
    this.getFinancialYear();
  }

  ngAfterViewInit() {
    // Assign the MatSort instance to the MatTableDataSource
    this.units.sort = this.sort;
    // You might also want to trigger an initial sort if desired
    // this.units.sort.sort({ id: 'name', start: 'asc', disableClear: false });
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
    });
  }

  openAddUnitDialog(): void {
    const dialogRef = this.dialog.open(AddEditUnitDialogComponent, {
      width: '400px',
      data: { unit: null, userId: this.userId, financialYear: this.financialYear }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.addUnitToList(result);
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
        this.updateUnit(result);
      }
    });
  }

  addUnitToList(unit: any): void {
    this.unitService.addUnit(unit).subscribe(response => {
      // Create a *new* array with the added unit
      const newData = [...this.units.data, response];
      this.units.data = newData; // Assign the new array
      // Re-apply sort after data changes
      if (this.units.sort) {
        const activeSort = this.units.sort.active || 'name'; // Default to 'name' if no active sort
        const sortDirection: SortDirection = this.units.sort.direction || 'asc'; // Default to 'asc'

        this.units.sort.sort({
          id: activeSort,
          start: sortDirection,
          disableClear: false // Crucial: Add disableClear property
        });
      }
      this.snackBar.open(`Unit "${response.name}" added successfully.`, 'Close', { duration: 3000 });
    });
  }

  updateUnit(unit: any): void {
    this.unitService.updateUnit(unit.id, unit).subscribe(response => {
      const index = this.units.data.findIndex(u => u.id === response.id);
      if (index !== -1) {
        // Create a *new* array with the updated unit
        const newData = [...this.units.data]; // Copy existing data
        newData[index] = response; // Update the copied array
        this.units.data = newData; // Assign the new array
        // Re-apply sort after data changes
        if (this.units.sort) {
          const activeSort = this.units.sort.active || 'name'; // Default to 'name' if no active sort
          const sortDirection: SortDirection = this.units.sort.direction || 'asc'; // Default to 'asc'

          this.units.sort.sort({
            id: activeSort,
            start: sortDirection,
            disableClear: false // Crucial: Add disableClear property
          });
        }
        this.snackBar.open(`Unit "${response.name}" updation is successfully.`, 'Close', { duration: 3000 });
      }
    });
  }

  deleteUnit(unitId: number, name: string): void {
    this.unitService.deleteUnit(unitId).subscribe({
      next: () => {
        // Create a *new* array without the deleted unit
        const newData = this.units.data.filter(unit => unit.id !== unitId);
        this.units.data = newData; // Assign the new array
        // Re-apply sort after data changes
        if (this.units.sort) {
          const activeSort = this.units.sort.active || 'name'; // Default to 'name' if no active sort
          const sortDirection: SortDirection = this.units.sort.direction || 'asc'; // Default to 'asc'

          this.units.sort.sort({
            id: activeSort,
            start: sortDirection,
            disableClear: false // Crucial: Add disableClear property
          });
        }
        this.snackBar.open(`Unit "${name}" deletion is successfully.`, 'Close', { duration: 3000 });
      },
      error: (error) => {
        this.snackBar.open(error.message, 'Close', { duration: 10000 });
      }
    });
  }
}
