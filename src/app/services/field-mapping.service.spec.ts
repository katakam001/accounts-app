import { TestBed } from '@angular/core/testing';

import { FieldMappingService } from './field-mapping.service';

describe('FieldMappingService', () => {
  let service: FieldMappingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FieldMappingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
