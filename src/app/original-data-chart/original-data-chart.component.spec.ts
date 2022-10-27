import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OriginalDataChartComponent } from './original-data-chart.component';

describe('OriginalDataChartComponent', () => {
  let component: OriginalDataChartComponent;
  let fixture: ComponentFixture<OriginalDataChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OriginalDataChartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OriginalDataChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
