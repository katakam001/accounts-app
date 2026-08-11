import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfitLossPageComponent } from './profit-loss-page.component';

describe('ProfitLossPageComponent', () => {
  let component: ProfitLossPageComponent;
  let fixture: ComponentFixture<ProfitLossPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfitLossPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfitLossPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
