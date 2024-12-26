import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { JournalListComponent } from './journal-list.component';

@NgModule({
  imports: [
    RouterModule.forChild([{ path: '', component: JournalListComponent }]),
    JournalListComponent // Import the standalone component
  ]
})
export class JournalListModule { }
