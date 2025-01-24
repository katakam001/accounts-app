import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DaybookComponent } from './daybook.component';

describe('DaybookComponent', () => {
  let component: DaybookComponent;
  let fixture: ComponentFixture<DaybookComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DaybookComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DaybookComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
