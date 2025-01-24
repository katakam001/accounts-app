import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DayBookComponent } from './daybook.component';

@NgModule({
  imports: [
    RouterModule.forChild([{ path: '', component: DayBookComponent }]),
    DayBookComponent // Import the standalone component
  ]
})
export class DayBookModule { }
