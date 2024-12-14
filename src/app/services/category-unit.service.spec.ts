import { TestBed } from '@angular/core/testing';

import { CategoryUnitService } from './category-unit.service';

describe('CategoryUnitService', () => {
  let service: CategoryUnitService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CategoryUnitService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
