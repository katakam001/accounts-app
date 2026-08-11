import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CopyJobListComponent } from './copy-job-list.component';

describe('CopyJobListComponent', () => {
  let component: CopyJobListComponent;
  let fixture: ComponentFixture<CopyJobListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CopyJobListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CopyJobListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
