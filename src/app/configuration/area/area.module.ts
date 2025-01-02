import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AreaComponent } from './area.component';

@NgModule({
  imports: [
    RouterModule.forChild([
      { path: '', component: AreaComponent }
    ]),
    AreaComponent // Import the standalone component
  ]
})
export class AreaModule { }
