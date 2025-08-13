import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClosingStockValuationComponent } from './closing-stock-valuation.component';

describe('ClosingStockValuationComponent', () => {
  let component: ClosingStockValuationComponent;
  let fixture: ComponentFixture<ClosingStockValuationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClosingStockValuationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClosingStockValuationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
