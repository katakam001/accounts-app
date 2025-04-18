import { NgModule } from '@angular/core';
import { LedgerComponent } from './ledger.component';
import { RouterModule } from '@angular/router';



@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild([{ path: '', component: LedgerComponent }]),
    LedgerComponent // Import the standalone component
  ]
})
export class LedgerModule { }
