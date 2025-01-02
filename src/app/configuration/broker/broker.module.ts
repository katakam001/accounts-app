import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BrokerComponent } from './broker.component';

@NgModule({
  imports: [
    RouterModule.forChild([
      { path: '', component: BrokerComponent }
    ]),
    BrokerComponent // Import the standalone component
  ]
})
export class BrokerModule { }
