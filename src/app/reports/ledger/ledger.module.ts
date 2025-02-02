import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LedgerComponent } from './ledger.component';

@NgModule({
  imports: [
    RouterModule.forChild([{ path: '', component: LedgerComponent }]),
    LedgerComponent // Import the standalone component
  ]
})
export class LedgerModule { }
