import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NetworkdataHeatmapViewComponent } from './networkdata-heatmap-view.component';

describe('NetworkdataHeatmapViewComponent', () => {
  let component: NetworkdataHeatmapViewComponent;
  let fixture: ComponentFixture<NetworkdataHeatmapViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NetworkdataHeatmapViewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NetworkdataHeatmapViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
