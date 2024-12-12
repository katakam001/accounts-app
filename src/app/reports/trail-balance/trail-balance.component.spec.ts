import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrailBalanceComponent } from './trail-balance.component';

describe('TrailBalanceComponent', () => {
  let component: TrailBalanceComponent;
  let fixture: ComponentFixture<TrailBalanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrailBalanceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrailBalanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
