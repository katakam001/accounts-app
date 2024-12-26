import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CategoryUnitsComponent } from './category-units.component';

@NgModule({
  imports: [
    RouterModule.forChild([{ path: '', component: CategoryUnitsComponent }]),
    CategoryUnitsComponent // Import the standalone component
  ]
})
export class CategoryUnitsModule { }
