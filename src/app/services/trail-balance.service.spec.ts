import { TestBed } from '@angular/core/testing';

import { TrailBalanceService } from './trail-balance.service';

describe('TrailBalanceService', () => {
  let service: TrailBalanceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TrailBalanceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
