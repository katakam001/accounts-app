import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditAreaDialogComponent } from './add-edit-area-dialog.component';

describe('AddEditAreaDialogComponent', () => {
  let component: AddEditAreaDialogComponent;
  let fixture: ComponentFixture<AddEditAreaDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditAreaDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddEditAreaDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
