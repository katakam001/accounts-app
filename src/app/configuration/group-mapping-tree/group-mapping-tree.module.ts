import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GroupMappingTreeComponent } from './group-mapping-tree.component';

@NgModule({
  imports: [
    RouterModule.forChild([{ path: '', component: GroupMappingTreeComponent }]),
    GroupMappingTreeComponent // Import the standalone component
  ]
})
export class GroupMappingTreeModule { }
