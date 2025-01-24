import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { StockRegisterComponent } from './stock-register.component';

@NgModule({
  imports: [
    RouterModule.forChild([{ path: '', component: StockRegisterComponent }]),
    StockRegisterComponent // Import the standalone component
  ]
})
export class StockRegisterModule { }
