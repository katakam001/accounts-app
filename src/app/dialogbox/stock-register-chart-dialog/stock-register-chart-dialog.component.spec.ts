import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StockRegisterChartDialogComponent } from './stock-register-chart-dialog.component';

describe('StockRegisterChartDialogComponent', () => {
  let component: StockRegisterChartDialogComponent;
  let fixture: ComponentFixture<StockRegisterChartDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockRegisterChartDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StockRegisterChartDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
