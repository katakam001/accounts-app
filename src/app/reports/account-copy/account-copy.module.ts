import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AccountCopyComponent } from './account-copy.component';

@NgModule({
  imports: [
    RouterModule.forChild([{ path: '', component: AccountCopyComponent }]),
    AccountCopyComponent // Import the standalone component
  ]
})
export class AccountCopyModule { }
