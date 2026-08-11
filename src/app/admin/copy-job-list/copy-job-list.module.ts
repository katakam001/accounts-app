import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CopyJobListComponent } from './copy-job-list.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild([{ path: '', component: CopyJobListComponent }]),
    CopyJobListComponent // Import the standalone component
  ]
})
export class CopyJobListModule { }
