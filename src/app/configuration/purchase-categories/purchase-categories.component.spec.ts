import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PurchaseCategoriesComponent } from './purchase-categories.component';

describe('PurchaseCategoriesComponent', () => {
  let component: PurchaseCategoriesComponent;
  let fixture: ComponentFixture<PurchaseCategoriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PurchaseCategoriesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PurchaseCategoriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
