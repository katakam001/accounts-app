import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { BrokerService } from '../../services/broker.service';
import { AddEditBrokerDialogComponent } from '../../dialogbox/add-edit-broker-dialog/add-edit-broker-dialog.component';
import { FinancialYearService } from '../../services/financial-year.service';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-broker',
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
  templateUrl: './broker.component.html',
  styleUrls: ['./broker.component.css']
})
export class BrokerComponent implements OnInit {
  displayedColumns: string[] = ['name', 'contact', 'email', 'actions'];
  dataSource: MatTableDataSource<any>;
  userId: number;
  financialYear: string;

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private brokerService: BrokerService,
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
      this.loadBrokers();
    }
  }


  loadBrokers(): void {
    this.brokerService.getBrokersByUserIdAndFinancialYear(this.userId, this.financialYear).subscribe((data: any[]) => {
      this.dataSource = new MatTableDataSource(data);
      this.dataSource.sort = this.sort;
    });
  }

  addBroker(): void {
    const dialogRef = this.dialog.open(AddEditBrokerDialogComponent, {
      width: '400px',
      data: { broker: null, userId: this.userId, financialYear: this.financialYear }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadBrokers();
      }
    });
  }

  editBroker(broker: any): void {
    const dialogRef = this.dialog.open(AddEditBrokerDialogComponent, {
      width: '400px',
      data: { broker, userId: this.userId, financialYear: this.financialYear }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadBrokers();
      }
    });
  }

  deleteBroker(brokerId: number): void {
    this.brokerService.deleteBroker(brokerId).subscribe(() => {
      this.loadBrokers();
    });
  }
}
