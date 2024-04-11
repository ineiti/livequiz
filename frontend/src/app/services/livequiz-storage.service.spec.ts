import { TestBed } from '@angular/core/testing';

import { LivequizStorageService } from './livequiz-storage.service';

describe('LivequizStorageService', () => {
  let service: LivequizStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LivequizStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
