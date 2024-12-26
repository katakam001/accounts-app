import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PurchaseCategoriesComponent } from './purchase-categories.component';

@NgModule({
  imports: [
    RouterModule.forChild([{ path: '', component: PurchaseCategoriesComponent }]),
    PurchaseCategoriesComponent // Import the standalone component
  ]
})
export class PurchaseCategoriesModule { }
