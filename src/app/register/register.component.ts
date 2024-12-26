import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [MatInputModule, ReactiveFormsModule, MatCardModule, MatIconModule,  CommonModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
  signupForm!: FormGroup;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) { }
  isSuccessful = false;
  isSignUpFailed = false;
  errorMessage = '';

  ngOnInit(): void {
    this.signupForm = this.fb.group({
      firstname: ['', Validators.required],
      middlename: [''],
      lastname: ['', Validators.required],
      username: ['', Validators.required],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.signupForm.valid) {
      const { firstname,middlename,lastname,username, email, password, confirmPassword } = this.signupForm.value;
      if (password === confirmPassword) {
        this.authService.register(firstname,middlename,lastname,username, email, password).subscribe({
          next: data => {
            console.log(data);
            this.isSuccessful = true;
            this.isSignUpFailed = false;
            console.log('Signup successful', { username, email, password });
            // Add your signup logic here
            setTimeout(() => {
              this.router.navigate(['/home']);
            }, 3000); // Redirect to home after 3 seconds
          },
          error: err => {
            this.errorMessage = err.error.message;
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
      this.errorMessage = 'Please fill in all required fields'; // Set error message
    }
  }
}

