import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SaleReturnComponent } from './sale-return.component';

const routes: Routes = [
  { path: '', component: SaleReturnComponent }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    SaleReturnComponent
  ]
})
export class SaleReturnModule { }
