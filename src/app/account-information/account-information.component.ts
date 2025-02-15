import { Component, OnInit } from '@angular/core';
import { StorageService } from '../services/storage.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-account-information',
    standalone: true,
    imports: [CommonModule,
      ReactiveFormsModule,
      MatCardModule,
      MatIconModule,
      MatListModule
],
  templateUrl: './account-information.component.html',
  styleUrls: ['./account-information.component.css']
})
export class AccountInformationComponent implements OnInit {
  user: any;

  constructor(private storageService: StorageService) {}

  ngOnInit(): void {
    this.user = this.storageService.getUser();
  }
}
