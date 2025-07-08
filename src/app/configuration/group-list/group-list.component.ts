import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { GroupService } from '../../services/group.service';
import { Group } from '../../models/group.interface';
import { EditGroupDialogComponent } from '../../dialogbox/edit-group-dialog/edit-group-dialog.component';
import { AddGroupDialogComponent } from '../../dialogbox/add-group-dialog/add-group-dialog.component';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { StorageService } from '../../services/storage.service';
import { FinancialYearService } from '../../services/financial-year.service';
import { MatSort, MatSortModule, SortDirection } from '@angular/material/sort'; // Import SortDirection
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-group-list',
  standalone: true,
  imports: [
    MatTableModule,
    MatToolbarModule,
    MatCardModule,
    CommonModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './group-list.component.html',
  styleUrls: ['./group-list.component.css']
})
export class GroupListComponent implements OnInit, AfterViewInit {
  groups = new MatTableDataSource<Group>();
  displayedColumns: string[] = ['name', 'description', 'actions'];
  financialYear: string;
  userId: number;

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private groupService: GroupService,
    public dialog: MatDialog,
    private storageService: StorageService,
    private financialYearService: FinancialYearService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.userId = this.storageService.getUser().id;
    this.getFinancialYear();
  }

  ngAfterViewInit() {
    // Assign the MatSort instance to the MatTableDataSource
    this.groups.sort = this.sort;
    // You might also want to trigger an initial sort if desired
    // this.groups.sort.sort({ id: 'name', start: 'asc', disableClear: false });
  }

  getFinancialYear() {
    const storedFinancialYear = this.financialYearService.getStoredFinancialYear();
    if (storedFinancialYear) {
      this.financialYear = storedFinancialYear;
      this.fetchGroups(this.userId, this.financialYear);
    }
  }

  fetchGroups(userId: number, financialYear: string): void {
    this.groupService.getGroupsByUserIdAndFinancialYear(userId, financialYear).subscribe((data: Group[]) => {
      this.groups.data = data;
    });
  }

  addGroup(): void {
    const dialogRef = this.dialog.open(AddGroupDialogComponent, {
      width: '400px',
      data: { userId: this.userId, financialYear: this.financialYear }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.groupService.addGroup(result).subscribe((response: Group) => {
          const newData = [...this.groups.data, response];
          this.groups.data = newData; // Update the data source

          // Re-apply sort after data changes
          if (this.groups.sort) {
            const activeSort = this.groups.sort.active || 'name'; // Default to 'name' if no active sort
            const sortDirection: SortDirection = this.groups.sort.direction || 'asc'; // Default to 'asc'

            this.groups.sort.sort({
              id: activeSort,
              start: sortDirection,
              disableClear: false // Crucial: Add disableClear property
            });
          }
          this.snackBar.open(`Group "${response.name}" added successfully.`, 'Close', { duration: 3000 });
        });
      }
    });
  }

  editGroup(group: Group): void {
    const dialogRef = this.dialog.open(EditGroupDialogComponent, {
      width: '400px',
      data: { userId: this.userId, financialYear: this.financialYear, group: group }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateGroup(result);
      }
    });
  }

  deleteGroup(id: number, name: string): void {
    this.groupService.deleteGroup(id).subscribe({
      next: () => {
        this.groups.data = this.groups.data.filter(group => group.id !== id); // Update the data source

        // Re-apply sort after data changes
        if (this.groups.sort) {
          const activeSort = this.groups.sort.active || 'name';
          const sortDirection: SortDirection = this.groups.sort.direction || 'asc';

          this.groups.sort.sort({
            id: activeSort,
            start: sortDirection,
            disableClear: false // Crucial: Add disableClear property
          });
        }
        this.snackBar.open(`Group "${name}" deletion is successfully.`, 'Close', { duration: 3000 });
      },
      error: (error) => {
        this.snackBar.open(error.message, 'Close', { duration: 10000 });
      }
    });
  }

  updateGroup(updatedGroup: Group): void {
    this.groupService.updateGroup(updatedGroup).subscribe((response: Group) => {
      const index = this.groups.data.findIndex(group => group.id === updatedGroup.id);
      if (index !== -1) {
        const newData = [...this.groups.data];
        newData[index] = response;
        this.groups.data = newData; // Update the data source

        // Re-apply sort after data changes
        if (this.groups.sort) {
          const activeSort = this.groups.sort.active || 'name';
          const sortDirection: SortDirection = this.groups.sort.direction || 'asc';

          this.groups.sort.sort({
            id: activeSort,
            start: sortDirection,
            disableClear: false // Crucial: Add disableClear property
          });
        }
        this.snackBar.open(`Group "${response.name}" updation is successfully.`, 'Close', { duration: 3000 });
      }
    });
  }
}