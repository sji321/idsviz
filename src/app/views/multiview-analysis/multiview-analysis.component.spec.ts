import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiviewAnalysisComponent } from './multiview-analysis.component';

describe('MultiviewAnalysisComponent', () => {
  let component: MultiviewAnalysisComponent;
  let fixture: ComponentFixture<MultiviewAnalysisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MultiviewAnalysisComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MultiviewAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
