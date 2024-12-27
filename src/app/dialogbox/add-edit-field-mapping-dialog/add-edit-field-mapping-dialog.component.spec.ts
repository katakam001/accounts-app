import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddEditFieldMappingDialogComponent } from './add-edit-field-mapping-dialog.component';


describe('AddEditFieldMappingDialogComponent', () => {
  let component: AddEditFieldMappingDialogComponent;
  let fixture: ComponentFixture<AddEditFieldMappingDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditFieldMappingDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddEditFieldMappingDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
