import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PurchaseFieldsComponent } from './purchase-fields.component';

@NgModule({
  imports: [
    RouterModule.forChild([{ path: '', component: PurchaseFieldsComponent }]),
    PurchaseFieldsComponent // Import the standalone component
  ]
})
export class PurchaseFieldsModule { }
