import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportSectionComponent } from './report-section.component';

describe('ReportSectionComponent', () => {
  let component: ReportSectionComponent;
  let fixture: ComponentFixture<ReportSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportSectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
