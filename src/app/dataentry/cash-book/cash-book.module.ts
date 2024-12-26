import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CashBookComponent } from './cash-book.component';

@NgModule({
  imports: [
    RouterModule.forChild([{ path: '', component: CashBookComponent }]),
    CashBookComponent // Import the standalone component
  ]
})
export class CashBookModule { }
