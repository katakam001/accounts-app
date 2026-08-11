import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ProfitLossPageComponent } from './profit-loss-page.component';

@NgModule({
  imports: [
    RouterModule.forChild([{ path: '', component: ProfitLossPageComponent }]),
    ProfitLossPageComponent
  ]
})
export class ProfitLossPageModule { }
