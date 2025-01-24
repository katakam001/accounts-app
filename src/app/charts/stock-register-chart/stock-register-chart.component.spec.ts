import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StockRegisterChartComponent } from './stock-register-chart.component';

describe('StockRegisterChartComponent', () => {
  let component: StockRegisterChartComponent;
  let fixture: ComponentFixture<StockRegisterChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockRegisterChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StockRegisterChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
