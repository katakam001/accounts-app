import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DebitNoteComponent } from './debit-note.component';

@NgModule({
  imports: [
    RouterModule.forChild([{ path: '', component: DebitNoteComponent }]),
    DebitNoteComponent // Import the standalone component
  ]
})
export class DebitNoteModule { }
