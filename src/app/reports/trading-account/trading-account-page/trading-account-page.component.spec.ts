import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TradingAccountPageComponent } from './trading-account-page.component';

describe('TradingAccountPageComponent', () => {
  let component: TradingAccountPageComponent;
  let fixture: ComponentFixture<TradingAccountPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TradingAccountPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TradingAccountPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
