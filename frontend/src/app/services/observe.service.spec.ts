import { TestBed } from '@angular/core/testing';

import { ObserveService } from './observe.service';

describe('ObserveService', () => {
  let service: ObserveService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ObserveService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
