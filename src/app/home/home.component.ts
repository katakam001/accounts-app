import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StorageService } from '../services/storage.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-home',
  standalone: true,
imports: [
    CommonModule,
    MatToolbarModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatGridListModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  isFreshUser: boolean = false;
  constructor(private router: Router, private storageService: StorageService, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.isFreshUser = params['isFreshUser'] === 'true';
    });

    if (this.storageService.isLoggedIn()) {
      const user = this.storageService.getUser();
      if (user && user.profile_completed === false) {
        this.router.navigate(['/user-details'], {
          queryParams: { isAdminFlow: false, fromLogin: true }
        });
      } else {
        if (this.isFreshUser) {
          this.storageService.clean();
          this.router.navigate(['/home']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      }
    }
  }
}
