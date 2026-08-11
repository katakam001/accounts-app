import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BalanceSheetHorizontalComponent } from './balance-sheet-horizontal.component';

describe('BalanceSheetHorizontalComponent', () => {
  let component: BalanceSheetHorizontalComponent;
  let fixture: ComponentFixture<BalanceSheetHorizontalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BalanceSheetHorizontalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BalanceSheetHorizontalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
