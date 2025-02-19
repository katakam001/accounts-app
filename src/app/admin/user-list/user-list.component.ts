import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { Router } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { StorageService } from '../../services/storage.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [ MatIconModule, MatButtonModule, CommonModule,MatTableModule,MatSortModule],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {
  displayedColumns: string[] = ['username', 'email','role', 'actions'];
  dataSource = new MatTableDataSource<any>();
  adminId: number;

  @ViewChild(MatSort) sort: MatSort;

  constructor(private adminService: AdminService, private router: Router, private storageService: StorageService) { }

  ngOnInit(): void {
    this.adminId = this.storageService.getUser().id; // Assuming adminId is stored as id
    this.adminService.getUsersForAdmin().subscribe(users => {
      this.dataSource.data = users;
      this.dataSource.sort = this.sort;
    });
  }

  navigateToCreateUser(): void {
    this.router.navigate(['/register'], { queryParams: { role: 'user', adminId: this.adminId } });
  }

  loginAsUser(user: any): void {
    const adminDetails = this.storageService.getUser();
    this.storageService.saveAdminDetails(adminDetails);

    this.adminService.loginAsUser(user.id).subscribe({
      next: () => {
        this.storageService.saveUser(user);
        this.router.navigate(['/dashboard']);
      },
      error: err => {
        console.error('Error impersonating user:', err);
      }
    });
  }

  switchBackToAdmin(): void {
    const adminDetails = this.storageService.getAdminDetails();
    if (adminDetails) {
      this.storageService.saveUser(adminDetails);
      this.router.navigate(['/admin-dashboard']);
      this.storageService.clearAdminDetails();
    }
  }
}
