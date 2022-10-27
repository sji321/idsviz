import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NetworktrafficChartComponent } from './networktraffic-chart.component';

describe('NetworktrafficChartComponent', () => {
  let component: NetworktrafficChartComponent;
  let fixture: ComponentFixture<NetworktrafficChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NetworktrafficChartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NetworktrafficChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
