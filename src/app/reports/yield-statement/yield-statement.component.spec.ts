import { ComponentFixture, TestBed } from '@angular/core/testing';

import { YieldStatementComponent } from './yield-statement.component';

describe('YieldStatementComponent', () => {
  let component: YieldStatementComponent;
  let fixture: ComponentFixture<YieldStatementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [YieldStatementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(YieldStatementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
