import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CashSaleEntryComponent } from './cash-sale-entry.component';

describe('CashSaleEntryComponent', () => {
  let component: CashSaleEntryComponent;
  let fixture: ComponentFixture<CashSaleEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CashSaleEntryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CashSaleEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
