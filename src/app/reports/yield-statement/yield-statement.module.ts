import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { YieldStatementComponent } from './yield-statement.component';

@NgModule({
  imports: [
    RouterModule.forChild([{ path: '', component: YieldStatementComponent }]),
    YieldStatementComponent // Import the standalone component
  ]
})
export class YieldStatementModule { }
