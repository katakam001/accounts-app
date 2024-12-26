import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TrailBalanceComponent } from './trail-balance.component';

@NgModule({
  imports: [
    RouterModule.forChild([{ path: '', component: TrailBalanceComponent }]),
    TrailBalanceComponent // Import the standalone component
  ]
})
export class TrailBalanceModule { }
