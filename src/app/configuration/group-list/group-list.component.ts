import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { GroupService } from '../../services/group.service';
import { Group } from '../../models/group.interface';
import { EditGroupDialogComponent } from '../../dialogbox/edit-group-dialog/edit-group-dialog.component';
import { AddGroupDialogComponent } from '../../dialogbox/add-group-dialog/add-group-dialog.component';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { StorageService } from '../../services/storage.service';
import { FinancialYearService } from '../../services/financial-year.service';
import { MatSort, MatSortModule } from '@angular/material/sort';

@Component({
  selector: 'app-group-list',
  imports: [MatTableModule, MatToolbarModule, MatInputModule, ReactiveFormsModule, MatCardModule, MatSelectModule, MatIconModule, CommonModule, MatSortModule],
  templateUrl: './group-list.component.html',
  styleUrls: ['./group-list.component.css']
})
export class GroupListComponent implements OnInit {
  groups = new MatTableDataSource<Group>();
  displayedColumns: string[] = ['name', 'description', 'actions'];
  financialYear: string;

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private groupService: GroupService,
    public dialog: MatDialog,
    private storageService: StorageService,
    private financialYearService: FinancialYearService
  ) {}

  ngOnInit(): void {
    this.getFinancialYear();
    this.groups.sort = this.sort; // Initialize sorting
  }

  getFinancialYear() {
    this.financialYearService.financialYear$.subscribe(year => {
      this.financialYear = year;
      if (this.financialYear) {
        this.fetchGroups(this.storageService.getUser().id, this.financialYear);
      }
    });
  }

  fetchGroups(userId: number, financialYear: string): void {
    this.groupService.getGroupsByUserIdAndFinancialYear(userId, financialYear).subscribe((data: Group[]) => {
      this.groups.data = data;
      this.groups.sort = this.sort; // Set the sort after fetching the data
    });
  }

  addGroup(): void {
    const dialogRef = this.dialog.open(AddGroupDialogComponent, {
      width: '400px',
      data: { userId: this.storageService.getUser().id, financialYear: this.financialYear }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.groupService.addGroup(result).subscribe(() => {
          this.fetchGroups(this.storageService.getUser().id, this.financialYear); // Refresh the group list after adding a new group
        });
      }
    });
  }

  editGroup(group: Group): void {
    const dialogRef = this.dialog.open(EditGroupDialogComponent, {
      width: '400px',
      data: { userId: this.storageService.getUser().id, financialYear: this.financialYear, group: group }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateGroup(result);
      }
    });
  }

  deleteGroup(id: number): void {
    this.groupService.deleteGroup(id).subscribe(response => {
      console.log('Response status:', response.status);
      this.fetchGroups(this.storageService.getUser().id, this.financialYear); // Refresh the table by fetching the updated list of groups
    });
  }

  updateGroup(updatedGroup: Group): void {
    this.groupService.updateGroup(updatedGroup).subscribe(() => {
      const index = this.groups.data.findIndex(group => group.id === updatedGroup.id);
      if (index !== -1) {
        this.groups.data[index] = updatedGroup;
        this.groups._updateChangeSubscription(); // Refresh the table
      }
    });
  }
}
