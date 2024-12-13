import { TestBed } from '@angular/core/testing';

import { CashEntriesService } from './cash-entries.service';

describe('CashEntriesService', () => {
  let service: CashEntriesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CashEntriesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
