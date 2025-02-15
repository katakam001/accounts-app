import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
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
export class AreaComponent implements OnInit {
  displayedColumns: string[] = ['name', 'actions'];
  dataSource: MatTableDataSource<any>;
  areas: any[] = [];
  userId: number;
  financialYear: string;

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private areaService: AreaService,
    private financialYearService: FinancialYearService,
    private storageService: StorageService,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.userId = this.storageService.getUser().id;
    this.getFinancialYear();
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
      this.areas = data;
      this.dataSource = new MatTableDataSource(this.areas);
      this.dataSource.sort = this.sort;
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
      this.dataSource._updateChangeSubscription(); // Refresh the table
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
        this.dataSource._updateChangeSubscription(); // Refresh the table
      }
    });
  }
  
  deleteArea(areaId: number): void {
    this.areaService.deleteArea(areaId).subscribe(() => {
      // Create a *new* array without the deleted area
      const newData = this.dataSource.data.filter(area => area.id !== areaId);
      this.dataSource.data = newData; // Assign the new array
      this.dataSource._updateChangeSubscription(); // Refresh the table
    });
  }  
}
