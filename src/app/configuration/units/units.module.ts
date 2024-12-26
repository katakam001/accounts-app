import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { UnitsComponent } from './units.component';

@NgModule({
  imports: [
    RouterModule.forChild([{ path: '', component: UnitsComponent }]),
    UnitsComponent // Import the standalone component
  ]
})
export class UnitsModule { }
