import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TradingAccountComponent } from './trading-account.component';

describe('TradingAccountComponent', () => {
  let component: TradingAccountComponent;
  let fixture: ComponentFixture<TradingAccountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TradingAccountComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TradingAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
