import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { ItemsService } from '../../services/items.service';
import { AddEditItemDialogComponent } from '../../dialogbox/add-edit-item-dialog/add-edit-item-dialog.component';
import { FinancialYearService } from '../../services/financial-year.service';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-item-list',
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
  templateUrl: './item-list.component.html',
  styleUrls: ['./item-list.component.css']
})
export class ItemListComponent implements OnInit {
  displayedColumns: string[] = ['name', 'actions'];
  dataSource: MatTableDataSource<any>;
  items: any[] = [];
  userId: number;
  financialYear: string;

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private itemsService: ItemsService,
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
      this.loadItems();
    }
  }

  loadItems(): void {
    this.itemsService.getItemsByUserIdAndFinancialYear(this.userId, this.financialYear).subscribe((data: any[]) => {
      this.items = data;
      this.dataSource = new MatTableDataSource(this.items);
      this.dataSource.sort = this.sort;
    });
  }

  openAddItemDialog(): void {
    const dialogRef = this.dialog.open(AddEditItemDialogComponent, {
      width: '400px',
      data: { item: null, userId: this.userId, financialYear: this.financialYear }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.addItemToList(result);
      }
    });
  }

  openEditItemDialog(item: any): void {
    const dialogRef = this.dialog.open(AddEditItemDialogComponent, {
      width: '400px',
      data: { item, userId: this.userId, financialYear: this.financialYear }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateItem(result);
      }
    });
  }

  addItemToList(item: any): void {
    this.itemsService.addItem(item).subscribe(response => {
      // Create a *new* array with the added item
      const newData = [...this.dataSource.data, response];
      this.dataSource.data = newData; // Assign the new array
      this.dataSource._updateChangeSubscription(); // Refresh the table
    });
  }
  
  updateItem(item: any): void {
    this.itemsService.editItem(item.id, item).subscribe(response => {
      const index = this.dataSource.data.findIndex(i => i.id === response.id);
      if (index !== -1) {
        // Create a *new* array with the updated item
        const newData = [...this.dataSource.data]; // Copy existing data
        newData[index] = response; // Update the copied array
        this.dataSource.data = newData; // Assign the new array
        this.dataSource._updateChangeSubscription(); // Refresh the table
      }
    });
  }
  
  deleteItem(itemId: number): void {
    this.itemsService.deleteItem(itemId).subscribe(() => {
      // Create a *new* array without the deleted item
      const newData = this.dataSource.data.filter(item => item.id !== itemId);
      this.dataSource.data = newData; // Assign the new array
      this.dataSource._updateChangeSubscription(); // Refresh the table
    });
  }  
}