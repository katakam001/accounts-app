import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { YieldComponent } from './yield.component';

@NgModule({
  imports: [
    RouterModule.forChild([
      { path: '', component: YieldComponent }
    ]),
    YieldComponent // Import the standalone component
  ]
})
export class YieldModule { }
