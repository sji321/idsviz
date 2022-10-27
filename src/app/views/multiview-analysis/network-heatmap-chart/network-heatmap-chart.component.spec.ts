import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NetworkHeatmapChartComponent } from './network-heatmap-chart.component';

describe('NetworkHeatmapChartComponent', () => {
  let component: NetworkHeatmapChartComponent;
  let fixture: ComponentFixture<NetworkHeatmapChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NetworkHeatmapChartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NetworkHeatmapChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
