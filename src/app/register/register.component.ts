// src/app/register/register.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [MatInputModule, MatSelectModule, ReactiveFormsModule, MatCardModule, MatIconModule, CommonModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  signupForm!: FormGroup;
  isSuccessful = false;
  isSignUpFailed = false;
  errorMessage = '';
  adminId: number | null = null;
  isUserCreation: boolean = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.signupForm = this.fb.group({
      firstname: ['', Validators.required],
      middlename: [''],
      lastname: ['', Validators.required],
      username: ['', Validators.required],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['user', Validators.required]
    });

    this.route.queryParams.subscribe(params => {
      this.adminId = params['adminId'] ? parseInt(params['adminId'], 10) : null; // Get the adminId from query params and ensure it's an integer
      if (params['role'] === 'user') {
        this.isUserCreation = true;
        this.signupForm.get('role')?.disable(); // Disable role selection for user creation
      } else {
        this.isUserCreation = false;
        this.signupForm.get('role')?.enable(); // Enable role selection for admin creation
      }
    });
  }

  onSubmit(): void {
    if (this.signupForm.valid) {
      const { firstname, middlename, lastname, username, email, password, confirmPassword,role } = this.signupForm.value;
      const finalRole = this.isUserCreation ? 'user' : role;

      if (password === confirmPassword) {
        this.authService.register(firstname, middlename, lastname, username, email, password, finalRole, this.adminId).subscribe({
          next: data => {
            console.log(data);
            this.isSuccessful = true;
            this.isSignUpFailed = false;
            console.log('Registration successful', { username, email, password, role: finalRole });
            setTimeout(() => {
              if (this.isUserCreation) {
                this.router.navigate(['/user-list']);
              } else {
                this.router.navigate(['/home']);
              }
            }, 3000); // Redirect after 3 seconds
          },
          error: err => {
    this.errorMessage = err.message; // ✅ Extract message directly
            this.isSignUpFailed = true;
            this.isSuccessful = false;
          }
        });
      } else {
        console.log('Passwords do not match');
        this.isSignUpFailed = true;
        this.isSuccessful = false;
        this.errorMessage = "Passwords do not match";
      }
    } else {
      console.log('Form is invalid');
      this.isSignUpFailed = true;
      this.isSuccessful = false;
      this.errorMessage = 'Please fill in all required fields';
    }
  }
}
