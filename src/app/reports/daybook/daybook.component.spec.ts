import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DayBookComponent } from './daybook.component';

describe('DaybookComponent', () => {
  let component: DayBookComponent;
  let fixture: ComponentFixture<DayBookComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DayBookComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DayBookComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
