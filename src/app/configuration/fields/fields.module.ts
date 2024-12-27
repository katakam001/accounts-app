import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FieldsComponent } from '../fields/fields.component';

@NgModule({
  imports: [
    RouterModule.forChild([{ path: '', component: FieldsComponent }]),
    FieldsComponent // Import the standalone component
  ]
})
export class FieldsModule { }
