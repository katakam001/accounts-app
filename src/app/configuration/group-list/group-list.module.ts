import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GroupListComponent } from './group-list.component';

@NgModule({
  imports: [
    RouterModule.forChild([{ path: '', component: GroupListComponent }]),
    GroupListComponent // Import the standalone component
  ]
})
export class GroupListModule { }
