import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ExportHistoryComponent } from './export-history.component';

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild([{ path: '', component: ExportHistoryComponent }]),
    ExportHistoryComponent
  ]
})
export class ExportHistoryModule { }