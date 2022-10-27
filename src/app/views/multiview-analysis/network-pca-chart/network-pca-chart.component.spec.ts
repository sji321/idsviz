import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NetworkPCAChartComponent } from './network-pca-chart.component';

describe('NetworkPCAChartComponent', () => {
  let component: NetworkPCAChartComponent;
  let fixture: ComponentFixture<NetworkPCAChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NetworkPCAChartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NetworkPCAChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
