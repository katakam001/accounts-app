import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditUnitDialogComponent } from './add-edit-unit-dialog.component';

describe('AddEditUnitDialogComponent', () => {
  let component: AddEditUnitDialogComponent;
  let fixture: ComponentFixture<AddEditUnitDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditUnitDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddEditUnitDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
