import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditYieldDialogComponent } from './add-edit-yield-dialog.component';

describe('AddEditYieldDialogComponent', () => {
  let component: AddEditYieldDialogComponent;
  let fixture: ComponentFixture<AddEditYieldDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditYieldDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddEditYieldDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
