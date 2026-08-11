import { Component, OnInit } from '@angular/core';
import { StorageService } from '../services/storage.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-account-information',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatListModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  templateUrl: './account-information.component.html',
  styleUrls: ['./account-information.component.css']
})
export class AccountInformationComponent implements OnInit {
  user: any;
  isEditing = false;
  detailsForm!: FormGroup;

  constructor(
    private storageService: StorageService,
    private authService: AuthService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.user = this.storageService.getUser();

    this.detailsForm = this.fb.group({
      email: [this.user.email || '', [Validators.required, Validators.email]],
      contact_number: [this.user.contact_number || ''],
      company_name: [this.user.user_details?.company_name || '', Validators.required],
      owner_name: [this.user.user_details?.owner_name || ''],
      user_type: [this.user.user_details?.user_type ?? 0],
      pan_number: [this.user.user_details?.pan_number || ''],
      gst_number: [this.user.user_details?.gst_number || ''],
      city: [this.user.user_details?.city || ''],
      jurisdiction: [this.user.user_details?.jurisdiction || '']
    });
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
  }

  onUpdate(): void {
    if (this.detailsForm.valid) {
      this.authService.updateProfile(this.detailsForm.value).subscribe({
        next: (response) => {
          this.user = response;
          this.storageService.saveUser(response);
          this.isEditing = false;
        },
        error: err => {
          console.error('Update failed:', err);
        }
      });
    }
  }
}
