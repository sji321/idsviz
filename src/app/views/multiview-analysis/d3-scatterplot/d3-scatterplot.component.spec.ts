import { ComponentFixture, TestBed } from '@angular/core/testing';

import { D3ScatterplotComponent } from './d3-scatterplot.component';

describe('D3ScatterplotComponent', () => {
  let component: D3ScatterplotComponent;
  let fixture: ComponentFixture<D3ScatterplotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ D3ScatterplotComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(D3ScatterplotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
