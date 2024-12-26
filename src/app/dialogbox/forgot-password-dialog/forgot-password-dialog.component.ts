import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PasswordResetService } from '../../services/password-reset.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-forgot-password-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, MatInputModule, MatButtonModule, MatDialogModule, MatSnackBarModule,MatProgressSpinnerModule],
  templateUrl: './forgot-password-dialog.component.html',
  styleUrls: ['./forgot-password-dialog.component.css']
})
export class ForgotPasswordDialogComponent implements OnInit {
  forgotPasswordForm: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ForgotPasswordDialogComponent>,
    private passwordResetService: PasswordResetService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.valid) {
      const email = this.forgotPasswordForm.value.email;
      this.isLoading = true; // Show loading indicator

      this.passwordResetService.sendResetEmail(email).subscribe({
        next: () => {
          this.isLoading = false; // Hide loading indicator
          this.snackBar.open('Password reset email sent successfully!', 'Close', {
            duration: 5000,
          });
          this.dialogRef.close();
        },
        error: (err) => {
          this.isLoading = false; // Hide loading indicator
          console.error('Error sending password reset email:', err);
          this.snackBar.open('Failed to send password reset email. Please try again.', 'Close', {
            duration: 5000,
          });
        }
      });
    }
  }
}
