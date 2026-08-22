import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CopyJobDetailsComponent } from './copy-job-details.component';

describe('CopyJobDetailsComponent', () => {
  let component: CopyJobDetailsComponent;
  let fixture: ComponentFixture<CopyJobDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CopyJobDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CopyJobDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
