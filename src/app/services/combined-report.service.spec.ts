import { TestBed } from '@angular/core/testing';

import { CombinedReportService } from './combined-report.service';

describe('CombinedReportService', () => {
  let service: CombinedReportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CombinedReportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
