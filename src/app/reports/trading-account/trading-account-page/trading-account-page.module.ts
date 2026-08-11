import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TradingAccountPageComponent } from './trading-account-page.component';

@NgModule({
  imports: [
    RouterModule.forChild([{ path: '', component: TradingAccountPageComponent }]),
    TradingAccountPageComponent
  ]
})
export class TradingAccountPageModule {}
