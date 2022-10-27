import { TestBed } from '@angular/core/testing';

import { NetworktrafficManagmentService } from './networktraffic-managment.service';

describe('DygraphManagmentService', () => {
  let service: NetworktrafficManagmentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NetworktrafficManagmentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
