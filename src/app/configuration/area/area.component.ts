import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule, SortDirection } from '@angular/material/sort';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { AreaService } from '../../services/area.service';
import { AddEditAreaDialogComponent } from '../../dialogbox/add-edit-area-dialog/add-edit-area-dialog.component';
import { FinancialYearService } from '../../services/financial-year.service';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-area',
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
  templateUrl: './area.component.html',
  styleUrls: ['./area.component.css']
})
export class AreaComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['name', 'actions'];
  dataSource = new MatTableDataSource<any>();
  userId: number;
  financialYear: string;

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private areaService: AreaService,
    private financialYearService: FinancialYearService,
    private storageService: StorageService,
    public dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.userId = this.storageService.getUser().id;
    this.getFinancialYear();
  }

  ngAfterViewInit() {
    // Assign the MatSort instance to the MatTableDataSource
    this.dataSource.sort = this.sort;
    // You might also want to trigger an initial sort if desired
    // this.dataSource.sort.sort({ id: 'name', start: 'asc', disableClear: false });
  }
  getFinancialYear() {
    const storedFinancialYear = this.financialYearService.getStoredFinancialYear();
    if (storedFinancialYear) {
      this.financialYear = storedFinancialYear;
      this.loadAreas();
    }
  }

  loadAreas(): void {
    this.areaService.getAreasByUserIdAndFinancialYear(this.userId, this.financialYear).subscribe((data: any[]) => {
      this.dataSource.data = data;
    });
  }

  openAddAreaDialog(): void {
    const dialogRef = this.dialog.open(AddEditAreaDialogComponent, {
      width: '400px',
      data: { area: null, userId: this.userId, financialYear: this.financialYear }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.addAreaToList(result);
      }
    });
  }

  openEditAreaDialog(area: any): void {
    const dialogRef = this.dialog.open(AddEditAreaDialogComponent, {
      width: '400px',
      data: { area, userId: this.userId, financialYear: this.financialYear }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateArea(result);
      }
    });
  }

  addAreaToList(area: any): void {
    this.areaService.addArea(area).subscribe(response => {
      // Create a *new* array with the added area
      const newData = [...this.dataSource.data, response];
      this.dataSource.data = newData; // Assign the new array
      // Re-apply sort after data changes
      if (this.dataSource.sort) {
        const activeSort = this.dataSource.sort.active || 'name'; // Default to 'name' if no active sort
        const sortDirection: SortDirection = this.dataSource.sort.direction || 'asc'; // Default to 'asc'

        this.dataSource.sort.sort({
          id: activeSort,
          start: sortDirection,
          disableClear: false // Crucial: Add disableClear property
        });
      }
    });
  }

  updateArea(area: any): void {
    this.areaService.updateArea(area.id, area).subscribe(response => {
      const index = this.dataSource.data.findIndex(a => a.id === response.id);
      if (index !== -1) {
        // Create a *new* array with the updated area
        const newData = [...this.dataSource.data]; // Copy existing data
        newData[index] = response; // Update the copied array
        this.dataSource.data = newData; // Assign the new array
        // Re-apply sort after data changes
        if (this.dataSource.sort) {
          const activeSort = this.dataSource.sort.active || 'name'; // Default to 'name' if no active sort
          const sortDirection: SortDirection = this.dataSource.sort.direction || 'asc'; // Default to 'asc'

          this.dataSource.sort.sort({
            id: activeSort,
            start: sortDirection,
            disableClear: false // Crucial: Add disableClear property
          });
        }
      }
    });
  }

  deleteArea(areaId: number): void {
    this.areaService.deleteArea(areaId).subscribe(() => {
      // Create a *new* array without the deleted area
      const newData = this.dataSource.data.filter(area => area.id !== areaId);
      this.dataSource.data = newData; // Assign the new array
      // Re-apply sort after data changes
      if (this.dataSource.sort) {
        const activeSort = this.dataSource.sort.active || 'name'; // Default to 'name' if no active sort
        const sortDirection: SortDirection = this.dataSource.sort.direction || 'asc'; // Default to 'asc'

        this.dataSource.sort.sort({
          id: activeSort,
          start: sortDirection,
          disableClear: false // Crucial: Add disableClear property
        });
      }
    });
  }
}
