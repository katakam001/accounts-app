import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditCashBookDialogComponent } from './edit-cash-book-dialog.component';

describe('EditCashBookDialogComponent', () => {
  let component: EditCashBookDialogComponent;
  let fixture: ComponentFixture<EditCashBookDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditCashBookDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditCashBookDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
