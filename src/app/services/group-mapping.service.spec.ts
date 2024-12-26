import { TestBed } from '@angular/core/testing';

import { GroupMappingService } from './group-mapping.service';

describe('GroupMappingService', () => {
  let service: GroupMappingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GroupMappingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
