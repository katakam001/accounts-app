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
        this.loadAreas();
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
        this.loadAreas();
      }
    });
  }

  deleteArea(areaId: number): void {
    this.areaService.deleteArea(areaId).subscribe(() => {
      this.loadAreas();
    });
  }
}
