import { TestBed } from '@angular/core/testing';

import { ClosingStockValuationService } from './closing-stock-valuation.service';

describe('ClosingStockValuationService', () => {
  let service: ClosingStockValuationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClosingStockValuationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
