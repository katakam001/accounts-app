import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TradingAccountProfitLossComponent } from './trading-account-profit-loss.component';

describe('TradingAccountProfitLossComponent', () => {
  let component: TradingAccountProfitLossComponent;
  let fixture: ComponentFixture<TradingAccountProfitLossComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TradingAccountProfitLossComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TradingAccountProfitLossComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
