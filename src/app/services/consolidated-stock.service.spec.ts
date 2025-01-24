import { TestBed } from '@angular/core/testing';

import { ConsolidatedStockService } from './consolidated-stock.service';

describe('ConsolidatedStockService', () => {
  let service: ConsolidatedStockService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConsolidatedStockService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
