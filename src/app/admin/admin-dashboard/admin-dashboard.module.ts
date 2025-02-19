import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminDashboardComponent } from './admin-dashboard.component'; // Import the standalone component

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild([{ path: '', component: AdminDashboardComponent }]),
    AdminDashboardComponent // Import the standalone component
  ]
})
export class AdminDashboardModule { }
