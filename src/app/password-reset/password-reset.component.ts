import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PasswordResetService } from '../services/password-reset.service';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-password-reset',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatSnackBarModule,
    MatProgressSpinnerModule  ],
  templateUrl: './password-reset.component.html',
  styleUrls: ['./password-reset.component.css']
})
export class PasswordResetComponent implements OnInit {
  resetForm: FormGroup;
  token: string;
  isLoading = false;
  passwordStrength: string;
  successMessage: string;
  errorMessage: string;
  hideNewPassword = true;
  hideConfirmPassword = true;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private passwordResetService: PasswordResetService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParams['token'];
    this.resetForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6), this.passwordStrengthValidator]],
      confirmPassword: ['', [Validators.required]]
    }, { validator: this.passwordMatchValidator });
  }

  checkPasswordStrength(): void {
    const password = this.resetForm.value.newPassword;
    if (password.length < 6) {
      this.passwordStrength = 'Weak';
    } else if (password.length < 10) {
      this.passwordStrength = 'Medium';
    } else {
      this.passwordStrength = 'Strong';
    }
  }

  passwordStrengthValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const password = control.value;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const valid = hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
    return valid ? null : { weakPassword: true };
  }

  passwordMatchValidator(form: FormGroup): { [key: string]: boolean } | null {
    const newPasswordControl = form.get('newPassword');
    const confirmPasswordControl = form.get('confirmPassword');
    if (!newPasswordControl || !confirmPasswordControl) {
      return null;
    }
    return newPasswordControl.value === confirmPasswordControl.value ? null : { mismatch: true };
  }

  onSubmit(): void {
    if (this.resetForm.valid) {
      const newPassword = this.resetForm.value.newPassword;
      this.isLoading = true; // Show loading indicator

      this.passwordResetService.resetPassword(this.token, newPassword).subscribe({
        next: () => {
          this.isLoading = false; // Hide loading indicator
          this.successMessage = 'Password has been reset successfully!';
          this.snackBar.open(this.successMessage, 'Close', {
            duration: 5000,
          });
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.isLoading = false; // Hide loading indicator
          this.errorMessage = this.getErrorMessage(err);
          this.snackBar.open(this.errorMessage, 'Close', {
            duration: 5000,
          });
          console.error('Error resetting password:', err);
        }
      });
    }
  }

  getErrorMessage(error: any): string {
    if (error.status === 400) {
      return 'Invalid request. Please check the entered data.';
    } else if (error.status === 404) {
      return 'Reset token not found. Please request a new password reset.';
    } else {
      return 'An unexpected error occurred. Please try again later.';
    }
  }
}
