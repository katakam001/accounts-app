import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportHistoryComponent } from './export-history.component';

describe('ExportHistoryComponent', () => {
  let component: ExportHistoryComponent;
  let fixture: ComponentFixture<ExportHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExportHistoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExportHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
