import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NetworkTSNEChartComponent } from './network-tsne-chart.component';

describe('NetworkTSNEChartComponent', () => {
  let component: NetworkTSNEChartComponent;
  let fixture: ComponentFixture<NetworkTSNEChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NetworkTSNEChartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NetworkTSNEChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
