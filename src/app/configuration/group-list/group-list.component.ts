import { Component, OnInit, ViewChild } from '@angular/core';
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
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-group-list',
  standalone: true,
  imports: [MatTableModule, MatToolbarModule, MatCardModule, CommonModule, MatSortModule,MatIconModule],
  templateUrl: './group-list.component.html',
  styleUrls: ['./group-list.component.css']
})
export class GroupListComponent implements OnInit {
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
    private snackBar: MatSnackBar // Inject MatSnackBar
  ) {}

  ngOnInit(): void {
    this.userId = this.storageService.getUser().id;
    this.getFinancialYear();
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
      this.groups.sort = this.sort; // Set the sort after fetching the data
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
          // Create a new array with the added group
          this.groups.data = [...this.groups.data, response];
          this.groups._updateChangeSubscription(); // Refresh the table
          this.snackBar.open(`Group "${response.name}" added successfully.`,'Close',{ duration: 3000 });
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

  deleteGroup(id: number,name:string): void {
    this.groupService.deleteGroup(id).subscribe({
      next: () => {
        // Create a new array without the deleted group
        this.groups.data = this.groups.data.filter(group => group.id !== id);
        this.groups._updateChangeSubscription(); // Refresh the table
        this.snackBar.open(`Group "${name}" deletion is successfully.`,'Close',{ duration: 3000 });
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
        // Create a new array with the updated group
        const newData = [...this.groups.data];
        newData[index] = response;
        this.groups.data = newData;
        this.groups._updateChangeSubscription(); // Refresh the table
        this.snackBar.open(`Group "${response.name}" updation is successfully.`,'Close',{ duration: 3000 });
      }
    });
  }
}
