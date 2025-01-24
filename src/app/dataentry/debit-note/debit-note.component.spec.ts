import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DebitNoteComponent } from './debit-note.component';

describe('DebitNoteComponent', () => {
  let component: DebitNoteComponent;
  let fixture: ComponentFixture<DebitNoteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DebitNoteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DebitNoteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
