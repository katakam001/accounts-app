import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryUnitsComponent } from './category-units.component';

describe('CategoryUnitsComponent', () => {
  let component: CategoryUnitsComponent;
  let fixture: ComponentFixture<CategoryUnitsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryUnitsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CategoryUnitsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
