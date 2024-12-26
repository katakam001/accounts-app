import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SaleEntryComponent } from './sale-entry.component';

@NgModule({
  imports: [
    RouterModule.forChild([{ path: '', component: SaleEntryComponent }]),
    SaleEntryComponent // Import the standalone component
  ]
})
export class SaleEntryModule { }
