import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CopyJobDetailsComponent } from './copy-job-details.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild([{ path: '', component: CopyJobDetailsComponent }]),
    CopyJobDetailsComponent // Import the standalone component
  ]
})
export class CopyJobDetailsModule { }
