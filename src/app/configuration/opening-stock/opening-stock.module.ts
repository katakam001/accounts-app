import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { OpeningStockComponent } from './opening-stock.component';

@NgModule({
  imports: [
    RouterModule.forChild([{ path: '', component: OpeningStockComponent }]),
    OpeningStockComponent // Import the standalone component
  ]
})
export class OpeningStockModule { }
