import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserListComponent } from './user-list.component'; // Import the standalone component

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild([{ path: '', component: UserListComponent }]),
    UserListComponent // Import the standalone component
  ]
})
export class UserListModule { }
