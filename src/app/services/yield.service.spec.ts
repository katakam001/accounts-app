import { TestBed } from '@angular/core/testing';

import { YieldService } from './yield.service';

describe('YieldService', () => {
  let service: YieldService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(YieldService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
