import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CreditNoteComponent } from './credit-note.component';

@NgModule({
  imports: [
    RouterModule.forChild([{ path: '', component: CreditNoteComponent }]),
    CreditNoteComponent // Import the standalone component
  ]
})
export class CreditNoteModule { }
