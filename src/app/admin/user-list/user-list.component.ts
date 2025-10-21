import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { Router } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { StorageService } from '../../services/storage.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {
  displayedColumns: string[] = ['username', 'email', 'role', 'actions'];
  dataSource = new MatTableDataSource<any>();
  adminId: number;
  adminUser: string;


  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private adminService: AdminService,
    private router: Router,
    private storageService: StorageService
  ) { }

  ngOnInit(): void {
    this.adminId = this.storageService.getUser().id;
    this.adminUser = this.storageService.getUser().username;

    this.adminService.getUsersForAdmin().subscribe(users => {
      this.dataSource.data = users;
      this.dataSource.sort = this.sort;

      // ✅ Custom filter across multiple fields
      this.dataSource.filterPredicate = (data, filter) => {
        const normalized = filter.trim().toLowerCase();
        return (
          data.username?.toLowerCase().includes(normalized) ||
          data.email?.toLowerCase().includes(normalized)
        );
      };
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  navigateToCreateUser(): void {
    this.router.navigate(['/register'], {
      queryParams: { role: 'user', adminId: this.adminId }
    });
  }

  loginAsUser(user: any): void {
    const adminDetails = this.storageService.getUser();
    this.storageService.saveAdminDetails(adminDetails);

    this.adminService.loginAsUser(user.id).subscribe({
      next: data => {
        this.storageService.saveUser(data);
        if (data.profile_completed) {
          this.storageService.setImpersonationState(true);
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/user-details'], {
            queryParams: {
              fromLogin: true,
              userId: data.id
            }
          });
        }
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
