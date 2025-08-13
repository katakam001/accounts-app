import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ClosingStockValuationComponent } from './closing-stock-valuation.component';

@NgModule({
  imports: [
    RouterModule.forChild([{ path: '', component: ClosingStockValuationComponent }]),
    ClosingStockValuationComponent // Import the standalone component
  ]
})
export class ClosingStockValuationModule { }
