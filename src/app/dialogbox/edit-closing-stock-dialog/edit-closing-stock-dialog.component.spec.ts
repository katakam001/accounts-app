import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditClosingStockDialogComponent } from './edit-closing-stock-dialog.component';

describe('EditClosingStockDialogComponent', () => {
  let component: EditClosingStockDialogComponent;
  let fixture: ComponentFixture<EditClosingStockDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditClosingStockDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditClosingStockDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
