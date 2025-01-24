import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ConversionComponent } from './conversion.component';

@NgModule({
  imports: [
    RouterModule.forChild([
      { path: '', component: ConversionComponent }
    ]),
    ConversionComponent // Import the standalone component
  ]
})
export class ConversionModule { }
