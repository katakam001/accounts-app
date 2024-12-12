import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditJournalEntryDialogComponent } from './edit-journal-entry-dialog.component';

describe('EditJournalItemDialogComponent', () => {
  let component: EditJournalEntryDialogComponent;
  let fixture: ComponentFixture<EditJournalEntryDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditJournalEntryDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditJournalEntryDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
