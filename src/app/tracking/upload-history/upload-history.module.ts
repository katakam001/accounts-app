import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { UploadHistoryComponent } from './upload-history.component';

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild([{ path: '', component: UploadHistoryComponent }]),
    UploadHistoryComponent
  ]
})
export class UploadHistoryModule { }
