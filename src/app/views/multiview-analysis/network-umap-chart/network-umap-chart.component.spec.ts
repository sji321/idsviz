import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NetworkUMAPChartComponent } from './network-umap-chart.component';

describe('NetworkUMAPChartComponent', () => {
  let component: NetworkUMAPChartComponent;
  let fixture: ComponentFixture<NetworkUMAPChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NetworkUMAPChartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NetworkUMAPChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
