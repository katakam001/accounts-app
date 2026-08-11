import { NgModule } from '@angular/core';
import { CashSaleEntryComponent } from './cash-sale-entry.component';
import { RouterModule } from '@angular/router';


@NgModule({
  imports: [
    RouterModule.forChild([{ path: '', component: CashSaleEntryComponent }]),
    CashSaleEntryComponent // Import the standalone component
  ]
})
export class CashSaleEntryModule { }