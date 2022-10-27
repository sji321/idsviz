import { Component, OnInit } from '@angular/core';
import {
  addEmptySpace,
  btnPressed,
  btnUnPressed,
  createButton,
  createCheckbox,
  createForeignObj,
  D3ChartAttributes
} from "../../d3ChartAttributes";
import * as d3 from 'd3';
import {cloneDeep} from 'lodash';

@Component({
  selector: 'app-d3-scatterplot',
  templateUrl: './d3-scatterplot.component.html',
  styleUrls: ['./d3-scatterplot.component.css']
})
export class D3ScatterplotComponent implements OnInit {
  public d3a: D3ChartAttributes;
  protected dataInstances;                 // random data point (x, y) + event type indicator (normal / abnormal)
  protected dataArray;

  private showLabelChecked = false;

  private ZoomActivation;
  private BrushingActivation;

  private elementsLabels;
  private elementsCircles;

  private btnZooming;
  private btnBrushing;
  private btnBrushingCancellation;
  private btnZoomingCancellation: any = null;

  private btnBrushingPressed;
  private btnZoomingPressed;

  private scatterplot;

  constructor() { }

  ngOnInit(): void {
  }

  init3ScattplotLayout() {
    this.createSVG();
  }

  drawd3ScattplotLayout() {
    this.drawTitle();
    this.drawMenus();
    this.drawELements();  // draw elements
  }

  public updateSVG() {
    this.d3a.svg = d3.select(this.d3a.nameChart)
      .attr('width', this.d3a.width + this.d3a.margin.left + this.d3a.margin.right)
      .attr('height', this.d3a.height + this.d3a.margin.top + this.d3a.margin.bottom)
      // .style('background', '#fff6de')
      .style('border', '1px #e0e0e0 dashed')
      .append('g')
      .attr('transform', 'translate(' + this.d3a.margin.left + ',' + this.d3a.margin.top + ')');

    // Add X axis
    this.d3a.xAxisScaleDefault = this.d3a.xAxisScale = d3.scaleLinear()
      .domain([-1, 1])
      .range([0, this.d3a.width]);
    this.d3a.xAxis
      .attr('transform', 'translate(0,' + this.d3a.height + ')')
      .call(d3.axisBottom(this.d3a.xAxisScale));

    // Add Y axis
    this.d3a.yAxisScaleDefault = this.d3a.yAxisScale = d3.scaleLinear()
      .domain([-1, 1])
      .range([this.d3a.height, 0]);
    this.d3a.yAxis
      .call(d3.axisLeft(this.d3a.yAxisScale));

    // Add a clipPath: everything out of this area won't be drawn.
    const clip = this.d3a.svg.append('defs').append('SVG:clipPath')
      .attr('id', 'clip')
      .append('SVG:rect')
      .attr('width', this.d3a.width )
      .attr('height', this.d3a.height )
      .attr('x', 0)
      .attr('y', 0);
  }

  private createSVG() {
    this.d3a.svg = d3.select(this.d3a.nameChart)
      .attr('width', this.d3a.width + this.d3a.margin.left + this.d3a.margin.right)
      .attr('height', this.d3a.height + this.d3a.margin.top + this.d3a.margin.bottom)
      // .style('background', '#fff6de')
      .style('border', '1px #e0e0e0 dashed')
      .append('g')
      .attr('transform', 'translate(' + this.d3a.margin.left + ',' + this.d3a.margin.top + ')');

    // Add X axis
    this.d3a.xAxisScaleDefault = this.d3a.xAxisScale = d3.scaleLinear()
      .domain([-1, 1])
      .range([0, this.d3a.width]);
    this.d3a.xAxis = this.d3a.svg.append('g')
      .attr('transform', 'translate(0,' + this.d3a.height + ')')
      .call(d3.axisBottom(this.d3a.xAxisScale));

    // Add Y axis
    this.d3a.yAxisScaleDefault = this.d3a.yAxisScale = d3.scaleLinear()
      .domain([-1, 1])
      .range([this.d3a.height, 0]);
    this.d3a.yAxis = this.d3a.svg.append('g')
      .call(d3.axisLeft(this.d3a.yAxisScale));

    // Add a clipPath: everything out of this area won't be drawn.
    const clip = this.d3a.svg.append('defs').append('SVG:clipPath')
      .attr('id', 'clip')
      .append('SVG:rect')
      .attr('width', this.d3a.width )
      .attr('height', this.d3a.height )
      .attr('x', 0)
      .attr('y', 0);
  }

  private drawELements(){
    // Draw elements

    // Create the scatter variable: where both the circles and the brush take place
    this.scatterplot = this.d3a.svg.append('g')
      .attr('clip-path', 'url(#clip)');

    this.elementsCircles = this.scatterplot
      .selectAll('circle')
      .data(this.dataInstances)
      .enter()
      .append('circle')
      .attr('class', d => d.EventType + d.Date)  // assign each instance (circle) with date information
      // .attr('x', d => this.d3a.xAxisScale(d.x))
      // .attr('y', d => this.d3a.yAxisScale(d.y))
      .attr('cx', d => this.d3a.xAxisScale(d.x))
      .attr('cy', d => this.d3a.yAxisScale(d.y))
      .attr('r', 3)
      .style('opacity', 0.5)
      .style('fill', d => this.d3a.colorMap[d.EventType]);

  }

  protected moveElements(){

    this.elementsCircles
      .transition()   // Transition from old to new
      .delay( (d, i) => (i * 3) )
      .duration(100) // Length of animation
      .attr('cx', d => this.d3a.xAxisScale(d.x))
      .attr('cy', d => this.d3a.yAxisScale(d.y));

    if (this.showLabelChecked === true && this.elementsLabels !== undefined) {
      this.elementsLabels
        .transition()
        .attr('x', d => this.d3a.xAxisScale(d.x))
        .attr('y', d => this.d3a.yAxisScale(d.y));

      // this.d3a.svg.selectAll('text')
      //   .data(this.dataInstances)
      //   .transition()   // Transition from old to new
      //   .attr('x', d => this.d3a.xAxisScale(d.x))
      //   .attr('y', d => this.d3a.yAxisScale(d.y))
      //   .attr("font-size", "9px");  // Font size
    }
  }

  private drawTitle(){
    this.d3a.svg.append('text')
      .attr('x', this.d3a.margin.left * 2)
      .attr('y', -20)
      .attr('text-anchor', 'middle')
      .style('font-family', 'Helvetica')
      .style('font-size', 10)
      .text(this.d3a.title);
  }

  /**
   * drawMenus
   * Drawing chart menus
   * @private
   */
  private drawMenus() {
    this.drawLabelsButton();
    this.drawBrushingButton();
    this.drawZoomButton();
  }

  private drawLabelsButton(){
    const fObj = createForeignObj(this.d3a.svg, this.d3a.width + 2, -10);
    const div = fObj.append('xhtml:div')
      .append('div');

    const button = createButton(div,
      '<i class="fa fa-info-circle"></i>', 'btn-link').on(
      'click', () => {
        this.showLabelChecked = !this.showLabelChecked;
        if (this.showLabelChecked === true){
          btnPressed(button);
          this.elementsLabels = this.scatterplot
            .selectAll('text')
            .data(this.dataInstances)
            .enter()
            .append('text')
            .text( d => d.EventType + d.Date)  // assign each instance (circle) with date information
            .attr('x', d => this.d3a.xAxisScale(d.x))
            .attr('y', d => this.d3a.yAxisScale(d.y))
            .attr("font-size", "8px")  // Font size
        } else {
          btnUnPressed(button);
          this.elementsLabels.remove();
        }
      }
    );
  }

  private drawBrushingButton() {
    if (this.btnBrushing === undefined) {
      const fObj = createForeignObj(this.d3a.svg, this.d3a.width + 2, 20);
      const div = fObj.append('xhtml:div')
        .append('div');

      this.btnBrushing = createButton(div,
        '<i class="fa fa-crosshairs"></i>', 'btn-link').on(
        'click', () => {
          this.btnBrushingPressed = btnPressed(this.btnBrushing);
          this.btnZoomingPressed = btnUnPressed(this.btnZooming);
          if (this.ZoomActivation !== undefined){
            d3.zoom().clear; // clear zooming
            this.ZoomActivation.remove(); // disable zoom activation
            this.clickZoomingCancelButton(); // disable zoom cancel button
          }
          this.enableBrushing();
          this.drawBrushingCancelButton();
        }
      );
    }
  }

  private drawZoomButton() {
    if (this.btnZooming === undefined) {
      const fObj = createForeignObj(this.d3a.svg, this.d3a.width + 2, 50);
      const div = fObj.append('xhtml:div')
        .append('div');

      this.btnZooming = createButton(div,
        '<i class="fa fa-search"></i>', 'btn-link').on(
        'click', () => {
          this.btnZoomingPressed = btnPressed(this.btnZooming);
          this.btnBrushingPressed = btnUnPressed(this.btnBrushing);
          this.clickBrushingCancelButton();
          this.enableZooming();
          this.drawZoomingCancelButton();
        }
      );
    }
  }

  private enableZooming() {
    const zoom = d3.zoom()
      .scaleExtent([.5, 15])  // This control how much you can unzoom (x0.5) and zoom (x15)
      .extent([[0, 0], [this.d3a.width, this.d3a.height]])
      .on('zoom', (e) => {
          this.d3a.xAxisScale = e.transform.rescaleX(this.d3a.xAxisScaleDefault);
          this.d3a.yAxisScale = e.transform.rescaleY(this.d3a.yAxisScaleDefault);

          // update axes with these new boundaries
          this.d3a.xAxis.call(d3.axisBottom(this.d3a.xAxisScale));
          this.d3a.yAxis.call(d3.axisLeft(this.d3a.yAxisScale));

          // update circle position
          this.scatterplot
            .selectAll('circle')
            .attr('cx', d => this.d3a.xAxisScale(d.x))
            .attr('cy', d => this.d3a.yAxisScale(d.y));

          if (this.showLabelChecked === true) {
            this.scatterplot
              .selectAll('text')
              .attr('x', d => this.d3a.xAxisScale(d.x))
              .attr('y', d => this.d3a.yAxisScale(d.y));
          }
          // this.drawZoomingCancelButton();
        }
      );

    // This add an invisible rect on top of the chart area.
    // This rect can recover pointer events: necessary to understand when the user zoom
    this.ZoomActivation = this.d3a.svg.append('rect')
      .attr('width', this.d3a.width)
      .attr('height', this.d3a.height)
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .attr('transform', 'translate(' + this.d3a.margin.left + ',' + this.d3a.margin.top + ')')
      .call(zoom);
  }

  // A function that return TRUE or FALSE according if a dot is in the selection or not
  // isBrushed(brush_coords, cx, cy) {
  //   var x0 = brush_coords[0][0],
  //     x1 = brush_coords[1][0],
  //     y0 = brush_coords[0][1],
  //     y1 = brush_coords[1][1];
  //   return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;    // This return TRUE or FALSE depending on if the points is in the selected area
  // }

  private enableBrushing() {

    this.BrushingActivation = this.d3a.svg
      .append("g")
      .attr("class", "brush")
      .call(
        d3.brush().extent([[0, 0], [this.d3a.width, this.d3a.height]])
          .on("start", () => {
            // console.log('brush_startEvent();');
          })
          // .on("brush", () => { })
          .on('brush', (e) => {
            // console.log('brush_brushEvent();');
            const extent = e.selection

            const x0 = this.d3a.xAxisScale.invert(extent[0][0]);  // left
            const x1 = this.d3a.xAxisScale.invert(extent[1][0]);  // right
            const y0 = this.d3a.yAxisScale.invert(extent[1][1]);  // bottom
            const y1 = this.d3a.yAxisScale.invert(extent[0][1]);  // top

            // console.log(x0.toFixed(2) +' ' + x1.toFixed(2) + ' ' + y0.toFixed(2) + ' ' + y1.toFixed(2));

            this.scatterplot
              .selectAll('circle').each(
              (d, i) => {

                if (x0 <= d.x && d.x <= x1 && y0 <= d.y && d.y <= y1) {
                  // selected instances
                  d3.selectAll('.' + d.EventType + d.Date)
                    .filter('circle')
                    .style('fill', this.d3a.colorMap[d.EventType])
                    .raise(); // Changing the order of SVG elements with D3 - selection.raise() and selection.lower()

                  d3.selectAll('.' + d.EventType + d.Date)
                    .filter('path')
                    .style('fill', 'none')
                    .style('stroke', this.d3a.colorMap[d.EventType])
                    .raise(); //

                } else {
                  // not selected instances
                  d3.selectAll('.' + d.EventType + d.Date)
                    .filter('circle')
                    .style('fill', 'lightgrey')
                    .lower();

                  d3.selectAll('.' + d.EventType + d.Date)
                    .filter('path')
                    .style('fill', 'none')
                    .style('stroke', 'lightgrey')
                    .lower();
                }
              }
            );
          })
          .on("end", (e) => {
            if (!e.selection) {
              // console.log("you clicked outside the brush");
              this.unselectAllInstances();
            }
            // console.log('brush_endEvent();');
          })
          .on("start.nokey", function() {
            // d3.select(window).on("keydown.brush keyup.brush", null);
            // console.log('start.nokey');
          })
      );
  }

  private unselectAllInstances(){
    this.scatterplot
      .selectAll('circle').each(
      (d, i) => {
        d3.selectAll('.' + d.EventType + d.Date)
          .filter('circle')
          .style('fill', this.d3a.colorMap[d.EventType]);

        d3.selectAll('.' + d.EventType + d.Date)
          .filter('path')
          .style('fill', 'none')
          .style('stroke', this.d3a.colorMap[d.EventType]);
      }
    );
  }

  private clickBrushingCancelButton() {
    // console.log('clickBrushingCancelButton()');
    if (this.BrushingActivation !== undefined) {
      d3.brush().clear; // clear brushing
      this.BrushingActivation.remove();
    }
    if (this.btnBrushingCancellation !== undefined)
      this.btnBrushingCancellation.remove();

    this.unselectAllInstances();
  }

  drawBrushingCancelButton() {
    const fObj = createForeignObj(this.d3a.svg, this.d3a.width + 2, 80);
    const div = fObj.append('xhtml:div')
      .append('div');

    this.btnBrushingCancellation = createButton(div,
      '<i class="fa fa-ban"></i>', 'btn-link').on(
      'click', () => {
        if (this.BrushingActivation !== undefined) {
          d3.brush().clear; // clear brushing
          this.BrushingActivation.remove();
          this.enableBrushing();
        }
        this.unselectAllInstances();

        // console.log('brushing cancellation');
      }
    );
  }

  private clickZoomingCancelButton() {
    // this.btnZoomingCancellation.attr('hidden', 'true');  // button to hide
    if (this.btnZoomingCancellation !== null){
      this.btnZoomingCancellation.remove();
      this.btnZoomingCancellation = null;
    }
  }

  private drawZoomingCancelButton() {
    this.btnZoomingCancellation = createButton(createForeignObj(this.d3a.svg, this.d3a.width + 2, 80),
      '<i class="fa fa-ban"></i>', 'btn-link').on(
      'click', () => {
        // this.clickZoomingCancelButton();

        // reset Axis Scaling
        this.d3a.xAxisScale = this.d3a.xAxisScaleDefault;
        this.d3a.yAxisScale = this.d3a.yAxisScaleDefault;

        // update axes with these new boundaries
        this.d3a.xAxis.call(d3.axisBottom(this.d3a.xAxisScale));
        this.d3a.yAxis.call(d3.axisLeft(this.d3a.yAxisScale));

        // update circle position
        this.scatterplot
          .selectAll('circle')
          .transition()   // Transition from old to new
          .duration(100) // Length of animation
          .ease(d3.easeLinear)
          .attr('cx', d => this.d3a.xAxisScale(d.x))
          .attr('cy', d => this.d3a.yAxisScale(d.y));

        if (this.showLabelChecked === true && this.elementsLabels !== undefined) {
          this.elementsLabels
            .transition()
            .attr('x', d => this.d3a.xAxisScale(d.x))
            .attr('y', d => this.d3a.yAxisScale(d.y));
        }
      }
    );
    // this.btnZoomingCancellation.attr('hidden', null); // button to show
  }

  protected drawHorzMenus(div) {
    addEmptySpace(div);
    addEmptySpace(div);

    createCheckbox(div,'&nbsp;<span style="font-size: 9pt;">Label</span>', false).on(
      'change',
      this.clickShowLabelCheckBox.bind(this)
    )
  }

  private clickShowLabelCheckBox() {
    this.showLabelChecked = !this.showLabelChecked;
    if (this.showLabelChecked === true){
      this.elementsLabels = this.scatterplot
        .selectAll('text')
        .data(this.dataInstances)
        .enter()
        .append('text')
        .text( d => d.EventType + d.Date)  // assign each instance (circle) with date information
        .attr('x', d => this.d3a.xAxisScale(d.x))
        .attr('y', d => this.d3a.yAxisScale(d.y))
        .attr("font-size", "8px")  // Font size
    } else {
      this.elementsLabels.remove();
    }
  }


}
// this.clickCloseButton.bind(this)
