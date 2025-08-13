import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditOpeningStockDialogComponent } from './add-edit-opening-stock-dialog.component';

describe('AddEditOpeningStockDialogComponent', () => {
  let component: AddEditOpeningStockDialogComponent;
  let fixture: ComponentFixture<AddEditOpeningStockDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditOpeningStockDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddEditOpeningStockDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
