import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PurchaseReturnComponent } from './purchase-return.component';

describe('PurchaseReturnComponent', () => {
  let component: PurchaseReturnComponent;
  let fixture: ComponentFixture<PurchaseReturnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PurchaseReturnComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PurchaseReturnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
