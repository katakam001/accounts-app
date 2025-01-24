import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ProductionEntryComponent } from './production-entry.component';

@NgModule({
  imports: [
    RouterModule.forChild([{ path: '', component: ProductionEntryComponent }]),
    ProductionEntryComponent // Import the standalone component
  ]
})
export class ProductionEntryModule { }
