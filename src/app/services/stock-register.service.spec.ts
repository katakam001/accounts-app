import { TestBed } from '@angular/core/testing';

import { StockRegisterService } from './stock-register.service';

describe('StockRegisterService', () => {
  let service: StockRegisterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StockRegisterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
