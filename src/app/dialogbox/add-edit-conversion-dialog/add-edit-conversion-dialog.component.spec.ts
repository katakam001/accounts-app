import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditConversionDialogComponent } from './add-edit-conversion-dialog.component';

describe('AddEditConversionDialogComponent', () => {
  let component: AddEditConversionDialogComponent;
  let fixture: ComponentFixture<AddEditConversionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditConversionDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddEditConversionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
