import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditBrokerDialogComponent } from './add-edit-broker-dialog.component';

describe('AddEditBrokerDialogComponent', () => {
  let component: AddEditBrokerDialogComponent;
  let fixture: ComponentFixture<AddEditBrokerDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditBrokerDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddEditBrokerDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
