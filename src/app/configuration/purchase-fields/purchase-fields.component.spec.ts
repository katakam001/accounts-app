import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PurchaseFieldsComponent } from './purchase-fields.component';

describe('PurchaseFieldsComponent', () => {
  let component: PurchaseFieldsComponent;
  let fixture: ComponentFixture<PurchaseFieldsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PurchaseFieldsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PurchaseFieldsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
