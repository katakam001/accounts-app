import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCashBookDialogComponent } from './add-cash-book-dialog.component';

describe('CashBookDialogComponent', () => {
  let component: AddCashBookDialogComponent;
  let fixture: ComponentFixture<AddCashBookDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddCashBookDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddCashBookDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
