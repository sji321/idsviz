import { TestBed } from '@angular/core/testing';

import { UserInteractionService } from './user-interaction.service';

describe('UserInteractionService', () => {
  let service: UserInteractionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserInteractionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
