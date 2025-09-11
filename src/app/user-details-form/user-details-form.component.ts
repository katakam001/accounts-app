import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../services/auth.service';
import { StorageService } from '../services/storage.service';

@Component({
  selector: 'app-user-details-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './user-details-form.component.html',
  styleUrls: ['./user-details-form.component.css']
})
export class UserDetailsFormComponent implements OnInit {
  detailsForm!: FormGroup;
  isSuccessful = false;
  isFailed = false;
  errorMessage = '';
  isAdminFlow: boolean = false;
  fromLoginFlow: boolean = false;
  isFreshUser: boolean = false;
  userId: number | null = null;

  constructor(private fb: FormBuilder, private authService: AuthService, private storageService: StorageService,
    private router: Router, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.detailsForm = this.fb.group({
      company_name: ['', Validators.required],
      owner_name: [''],
      user_type: [0],
      pan_number: [''],
      gst_number: [''],
      city: [''],
      jurisdiction: ['']
    });
    this.route.queryParams.subscribe(params => {
      this.userId = params['userId'] ? parseInt(params['userId'], 10) : null; // Get the adminId from query params and ensure it's an integer
      this.fromLoginFlow = params['fromLogin'] === 'true';
      this.isFreshUser = params['isFreshUser'] === 'true';
      this.isFreshUser = params['isFreshUser'] === 'true';
    });
  }

  onSubmit(): void {
    if (this.detailsForm.valid) {
      const userDetails = {
        ...this.detailsForm.value,
        userId: this.userId
      };
      this.authService.updateProfile(userDetails).subscribe({
        next: data => {
          this.isSuccessful = true;
          this.isFailed = false;
          console.log(this.isAdminFlow);
          console.log(this.fromLoginFlow);
          console.log(this.isFreshUser);
          setTimeout(() => {
            if (this.fromLoginFlow) {
              this.storageService.saveUser(data);
              this.router.navigate([this.isAdminFlow ? '/admin-dashboard' : '/dashboard']);
            } else {
              if (this.isAdminFlow) {
                this.router.navigate(['/user-list']);
                this.storageService.saveUser(data);
              } else {
                this.router.navigate(['/home'], {
                  queryParams: {
                    isFreshUser: this.isFreshUser
                  }
                });
              }
            }
          }, 3000);

        },
        error: err => {
          this.errorMessage = err.message;
          this.isFailed = true;
          this.isSuccessful = false;
        }
      });
    } else {
      this.errorMessage = 'Please fill in all required fields';
      this.isFailed = true;
      this.isSuccessful = false;
    }
  }
}
