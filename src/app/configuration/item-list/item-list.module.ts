import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ItemListComponent } from './item-list.component';

@NgModule({
  imports: [
    RouterModule.forChild([
      { path: '', component: ItemListComponent }
    ]),
    ItemListComponent // Import the standalone component
  ]
})
export class ItemListModule { }
