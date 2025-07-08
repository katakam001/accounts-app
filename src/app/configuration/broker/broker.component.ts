import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule, SortDirection } from '@angular/material/sort';
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
export class BrokerComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['name', 'contact', 'email', 'actions'];
  dataSource = new MatTableDataSource<any>();
  userId: number;
  financialYear: string;

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private brokerService: BrokerService,
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
      this.loadBrokers();
    }
  }

  loadBrokers(): void {
    this.brokerService.getBrokersByUserIdAndFinancialYear(this.userId, this.financialYear).subscribe((data: any[]) => {
      this.dataSource.data = data;
    });
  }
  addBroker(): void {
    const dialogRef = this.dialog.open(AddEditBrokerDialogComponent, {
      width: '400px',
      data: { broker: null, userId: this.userId, financialYear: this.financialYear }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.addBrokerToList(result);
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
        this.updateBroker(result);
      }
    });
  }

  addBrokerToList(broker: any): void { // Type the broker if possible
    // In your BrokerComponent (or wherever you call addBroker)
    this.brokerService.addBroker(broker).subscribe({
      next: (newBroker) => {
        console.log("Broker added (component):", newBroker); // Log the new broker
        console.log("Data source before update:", this.dataSource.data); // Log data source before
        const newData = [...this.dataSource.data, newBroker];
        this.dataSource.data = newData;
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
        this.dataSource._updateChangeSubscription();
        console.log("Data source after update:", this.dataSource.data); // Log data source after
      },
      error: (error) => {
        console.error("Error adding broker:", error);
      }
    });
  }

  updateBroker(broker: any): void { // Type the broker if possible
    this.brokerService.updateBroker(broker.id, broker).subscribe({
      next: (response: any) => { // Type the response
        const index = this.dataSource.data.findIndex(b => b.id === response.id);
        if (index !== -1) {
          const newData = [...this.dataSource.data];
          newData[index] = response;
          this.dataSource.data = newData;
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
          this.dataSource._updateChangeSubscription();
        }
      },
      error: (error) => {
        console.error("Error updating broker:", error);
      }
    });
  }

  deleteBroker(brokerId: number): void {
    this.brokerService.deleteBroker(brokerId).subscribe({
      next: () => {
        this.dataSource.data = this.dataSource.data.filter(broker => broker.id !== brokerId);
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
        this.dataSource._updateChangeSubscription();
      },
      error: (error) => {
        console.error("Error deleting broker:", error);
      }
    });
  }
}
