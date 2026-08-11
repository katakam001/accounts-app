import { TestBed } from '@angular/core/testing';

import { TradingReportService } from './trading-report.service';

describe('TradingReportService', () => {
  let service: TradingReportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TradingReportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
