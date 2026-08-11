import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TradingAccountProfitLossComponent } from './trading-account-profit-loss.component';

@NgModule({
  imports: [
    RouterModule.forChild([{ path: '', component: TradingAccountProfitLossComponent }]),
    TradingAccountProfitLossComponent
  ]
})
export class TradingAccountProfitLossModule { }
