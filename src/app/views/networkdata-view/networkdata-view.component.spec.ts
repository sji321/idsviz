import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NetworkdataViewComponent } from './networkdata-view.component';

describe('NetworkdataChartsComponent', () => {
  let component: NetworkdataViewComponent;
  let fixture: ComponentFixture<NetworkdataViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NetworkdataViewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NetworkdataViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
