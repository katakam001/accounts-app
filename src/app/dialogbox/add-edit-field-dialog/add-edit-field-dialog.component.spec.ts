import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditFieldDialogComponent } from './add-edit-field-dialog.component';

describe('AddEditFieldDialogComponent', () => {
  let component: AddEditFieldDialogComponent;
  let fixture: ComponentFixture<AddEditFieldDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditFieldDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddEditFieldDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
