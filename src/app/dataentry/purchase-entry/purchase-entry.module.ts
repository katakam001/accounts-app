import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PurchaseEntryComponent } from './purchase-entry.component';

@NgModule({
  imports: [
    RouterModule.forChild([{ path: '', component: PurchaseEntryComponent }]),
    PurchaseEntryComponent // Import the standalone component
  ]
})
export class PurchaseEntryModule { }
