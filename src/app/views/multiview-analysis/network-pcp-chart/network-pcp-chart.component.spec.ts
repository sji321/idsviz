import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NetworkPCPChartComponent } from './network-pcp-chart.component';

describe('NetworkPCPChartComponent', () => {
  let component: NetworkPCPChartComponent;
  let fixture: ComponentFixture<NetworkPCPChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NetworkPCPChartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NetworkPCPChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
