import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditProductionEntryDialogComponent } from './add-edit-production-entry-dialog.component';

describe('AddEditProductionEntryDialogComponent', () => {
  let component: AddEditProductionEntryDialogComponent;
  let fixture: ComponentFixture<AddEditProductionEntryDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditProductionEntryDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddEditProductionEntryDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
