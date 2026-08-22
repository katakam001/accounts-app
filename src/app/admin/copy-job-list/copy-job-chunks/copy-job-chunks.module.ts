import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CopyJobChunksComponent } from './copy-job-chunks.component';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild([{ path: '', component: CopyJobChunksComponent }]),
    CopyJobChunksComponent // Import the standalone component
  ]
})
export class CopyJobChunksModule { }
