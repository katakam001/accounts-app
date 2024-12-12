import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinancialYearDialogComponent } from './financial-year-dialog.component';

describe('FinancialYearDialogComponent', () => {
  let component: FinancialYearDialogComponent;
  let fixture: ComponentFixture<FinancialYearDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinancialYearDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinancialYearDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
