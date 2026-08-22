import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CopyJobChunksComponent } from './copy-job-chunks.component';

describe('CopyJobChunksComponent', () => {
  let component: CopyJobChunksComponent;
  let fixture: ComponentFixture<CopyJobChunksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CopyJobChunksComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CopyJobChunksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
