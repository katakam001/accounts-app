import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditEntryDialogComponent } from './add-edit-entry-dialog.component';

describe('AddEditEntryDialogComponent', () => {
  let component: AddEditEntryDialogComponent;
  let fixture: ComponentFixture<AddEditEntryDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditEntryDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddEditEntryDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
