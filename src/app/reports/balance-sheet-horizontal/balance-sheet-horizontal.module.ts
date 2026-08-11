import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BalanceSheetHorizontalComponent } from './balance-sheet-horizontal.component';

@NgModule({
  imports: [
    RouterModule.forChild([{ path: '', component: BalanceSheetHorizontalComponent }]),
    BalanceSheetHorizontalComponent
  ]
})
export class BalanceSheetHorizontalModule { }
