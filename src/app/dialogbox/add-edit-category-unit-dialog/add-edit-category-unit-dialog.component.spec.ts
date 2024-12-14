import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditCategoryUnitDialogComponent } from './add-edit-category-unit-dialog.component';

describe('AddEditCategoryUnitDialogComponent', () => {
  let component: AddEditCategoryUnitDialogComponent;
  let fixture: ComponentFixture<AddEditCategoryUnitDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditCategoryUnitDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddEditCategoryUnitDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
