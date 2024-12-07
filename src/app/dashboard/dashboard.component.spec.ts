import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomelistComponent } from './dashboard.component';

describe('HomeComponent', () => {
  let component: HomelistComponent;
  let fixture: ComponentFixture<HomelistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomelistComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomelistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
