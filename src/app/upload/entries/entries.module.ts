import { NgModule } from '@angular/core';
import { EntriesComponent } from './entries.component';
import { RouterModule } from '@angular/router';



@NgModule({
  imports: [
    RouterModule.forChild([{ path: '', component: EntriesComponent }]),
    EntriesComponent    ]
  })
export class EntriesModule { }


