import { NgModule } from '@angular/core';
import { BankStatementComponent } from './bank-statement.component';
import { RouterModule } from '@angular/router';



@NgModule({
  imports: [
    RouterModule.forChild([{ path: '', component: BankStatementComponent }]),
    BankStatementComponent // Import the standalone component
  ]
})
export class BankStatementModule { }
