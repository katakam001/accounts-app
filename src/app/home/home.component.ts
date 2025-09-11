import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StorageService } from '../services/storage.service';

@Component({
  selector: 'app-home',
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
