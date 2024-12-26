import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PurchaseReturnComponent } from './purchase-return.component';

@NgModule({
  imports: [
    RouterModule.forChild([{ path: '', component: PurchaseReturnComponent }]),
    PurchaseReturnComponent // Import the standalone component
  ]
})
export class PurchaseReturnModule { }
