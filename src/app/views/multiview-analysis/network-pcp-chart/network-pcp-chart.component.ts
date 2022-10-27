/**
 * Network Analysis on Parallel Coordinates
 * Author: Dong H Jeong
 * References:  https://www.d3-graph-gallery.com/graph/parallel_custom.html
 *              https://www.d3-graph-gallery.com/graph/parallel_basic.html
 *              https://bl.ocks.org/jasondavies/1341281
 *              https://syntagmatic.github.io/parallel-coordinates/
 * Initial: 3/29/2022
 *
 *
 */

import {AfterViewInit, Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {UserInteractionService} from "../../user-interaction.service";
import {MultiviewAnalysisComponent} from "../multiview-analysis.component";
import * as d3 from 'd3';
import {
  createButton,
  createForeignObj, createForeignObjDIV,
  D3ChartAttributes,
  initD3ChartAttributes,
  updateD3ChartSize
} from "../../d3ChartAttributes";
import {cloneDeep} from 'lodash';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-network-pcp-chart',
  templateUrl: './network-pcp-chart.component.html',
  styleUrls: ['./network-pcp-chart.component.css']
})
export class NetworkPCPChartComponent implements OnInit, AfterViewInit {
  @ViewChild('PCPAttributeSelectionDialog', { read: TemplateRef }) PCPAttributeDlgTemplateTemplate:TemplateRef<any>;
  public d3a: D3ChartAttributes;
  public uniqueChartIndexKey;
  // public enabled = false;
  private nameDimensions; // cloned dimensions are created because re-ordering is supported
  private data;

  btnSetting: any; // button
  modalSettingDlg: any; // modal dialog (settings)

  constructor(private _parent: MultiviewAnalysisComponent,
              private uiService: UserInteractionService,
              private modalDlgService: NgbModal) {

  }

  ngOnInit(): void {
    this.uniqueChartIndexKey = this._parent.uniqueChartIndexKey;
    this.nameDimensions = ['Date', ...this._parent.nameDimensions];//cloneDeep(this._parent.nameDimensions);
    this.data = this._parent.rawDataKeyValue;
    // this.data = cloneDeep(this._parent.rawDataKeyValue);
    // this.data.forEach(function(x){delete x.Date});  // remove Date variable

    // initialize d3 chart attributes
    this.d3a = initD3ChartAttributes();
    this.d3a.margin = {top: 40, right: 60, bottom: 40, left: 20};
    this.d3a = updateD3ChartSize(this.d3a, 960, 320);
    this.d3a.title = 'Raw: ' + this._parent.txtDataRange;
    this.d3a.colorMap = this._parent.colormap;
    this.d3a.nameChart = 'svg#' + 'pcpchart-' + this.uniqueChartIndexKey;
  }

  ngAfterViewInit() {
    this.drawAllElements();

    // this.enabled = true;
  }

  drawAllElements() {
    this.createSVG();
    this.drawSettingButton();
    this.drawPlot_w_Brushing();
    this.drawTitle();
    this.drawMenus();

    this.drawScaleBtns();
  }


  createSVG(){
    this.d3a.svg = d3.select(this.d3a.nameChart)
      .attr('width', this.d3a.width + this.d3a.margin.left + this.d3a.margin.right)
      .attr('height', this.d3a.height + this.d3a.margin.top + this.d3a.margin.bottom)
      // .style('background', '#fff6de')
      .style('border', '1px #e0e0e0 dashed')
      .append('g')
      .attr('transform', 'translate(' + this.d3a.margin.left + ',' + this.d3a.margin.top + ')');

  }


  dlgEventWithChange(event: any){
    this.d3a.width = parseFloat(event.target.value);
    this.d3a.svg.remove();
    this.drawAllElements();
  }

  dlgEventHeightChange(event: any){
    this.d3a.height = parseFloat(event.target.value);
    this.d3a.svg.remove();
    this.drawAllElements();
  }

  dlgBtnUpdate() {

  }

  drawScaleBtns(){

    // horizontally expanding
    {
      const fObj = createForeignObj(this.d3a.svg.append('g'),
        this.d3a.width + 30, this.d3a.height + 5);
      const div = fObj.append('xhtml:div')
        .append('div');

      createButton(div,
        '<i class="fa fa-caret-right"></i>', 'btn-link').on(
        'click', () => {
          this.d3a.width += 10;
          this.d3a.svg.remove();
          this.drawAllElements();
        }
      );
    }

    // horizontally shrinking
    {
      const fObj = createForeignObj(this.d3a.svg.append('g'),
        this.d3a.width + 5, this.d3a.height + 5,
        '25px');
      const div = fObj.append('xhtml:div')
        .append('div');

      createButton(div,
        '<i class="fa fa-caret-left"></i>', 'btn-link').on(
        'click', () => {
          this.d3a.width -= 10;
          this.d3a.svg.remove();
          this.drawAllElements();
        }
      );
    }

  }

  drawSettingButton(){
    this.btnSetting = createForeignObj(this.d3a.svg, this.d3a.width + 20, -40);
    const div = this.btnSetting.append('xhtml:div')
      .append('div');

    createButton(div,
      '<i class="fa fa-cog"></i>', 'btn-link').on(
      'click', () => {

        // open modal dialog
        this.modalSettingDlg = this.modalDlgService.open(this.PCPAttributeDlgTemplateTemplate, {size: 'sm', ariaLabelledBy: 'modal-basic-title', centered: true});
      }
    );
  }

  drawPlot_w_Brushing(){
    const y = Array();
    for (let col = 0; col < this.nameDimensions.length; col++) {
      const dimensionName = this.nameDimensions[col];
      if (dimensionName === 'Date') {
        y[dimensionName] = d3.scaleTime()
          .domain( [ new Date(this._parent.rawDataMinMax[dimensionName].min),
            new Date(this._parent.rawDataMinMax[dimensionName].max) ]) // --> Same axis range for each group
          .range([this.d3a.height, 0]);
      } else {
        y[dimensionName] = d3.scaleLinear()
          .domain( [this._parent.rawDataMinMax[dimensionName].min,
            this._parent.rawDataMinMax[dimensionName].max]) // --> Same axis range for each group
          // --> different axis range for each group --> .domain( [d3.extent(data, function(d) { return +d[name]; })] )
          .range([this.d3a.height, 0]);
      }
    }

    // Build the X scale -> it find the best position for each Y axis
    const x = d3.scalePoint()
      .range([0, this.d3a.width])
      .domain(this.nameDimensions);

    let dragging = {};

    const position = (d) => {
      const v = dragging[d];
      return v == null ? x(d) : v;
    };

    // The path function take a row of the csv as input, and return x and y coordinates of the line to draw for this raw.
    const path = (d) => d3.line()(
      this.nameDimensions.map( name =>
        [position(name), y[name](d[name])]
      )
    );

    // set the style of hidden data items (used for selection)
    this.d3a.svg
      .append('style')
      .text('path.hidden { stroke: #000; stroke-opacity: 0.01;}');

    // a map that holds any active brush per attribute
    let activeBrushes = new Map();

    const polylines = this.d3a.svg
      .append('g')
      .attr('fill', 'none')
      .attr('stroke-width', 1.0)
      .attr('stroke-opacity', 0.6) //optional
      .selectAll('path')
      .data(this.data)
      .enter().append('path')
      // .attr('class', (d, i) => 'i' + i + d.Date) // assign each instance (line) with date information
      .attr('class', d => d.EventType + d.Date)  // assign each instance (line) with date information
      .attr('d', path)
      .style('fill', 'none')
      .style('stroke', d => this.d3a.colorMap[d.EventType])
      .style('opacity', 0.5);

    // create the group nodes for the axes
    const axes = this.d3a.svg
      .selectAll('.dimension')
      .data(this.nameDimensions)
      .enter().append('g')
      // .attr('class', 'dimension')
      .attr('class', d => 'dimension_' + d)
      .attr('transform', (d) => 'translate(' + x(d) + ')');   // Translate this element to its right position on the x axis
    // axes
    //   .attr('cursor', 'move')
    //   .call(
    //     d3.drag()
    //       .on('start', (event, d) => {
    //         console.log('start');
    //         dragging[d] = x(d);
    //         // var cursor = event.target.style.cursor;
    //         // console.log(cursor);
    //       })
    //       .on('drag', (event, d) => {
    //         console.log('drag');
    //         console.log(event.x + ' : ' + (x(d) + event.x));
    //         dragging[d] = Math.min(this.d3a.width, Math.max(0, event.x));
    //         polylines.attr('d',  path);
    //
    //         // reordering based on the positional information of each dimension
    //         this.nameDimensions.sort( (a, b) => position(a) - position(b) );
    //         x.domain(this.nameDimensions);  // update re-ordered dimensions
    //         axes.attr('transform', d => 'translate(' + position(d) + ')');
    //       })
    //       .on('end', (event, d) => {
    //         console.log('end');
    //         delete dragging[d];
    //         axes.attr('transform', d => 'translate(' + x(d) + ')');
    //         polylines.attr('d', path);
    //       })
    //   );

    // add the visual representation of the axes
    axes.append('g')
      .attr('class', 'axis')
      .each( (d, i, nodes) => { d3.select(nodes[i]).call(d3.axisRight(this.d3a.yAxisScale).ticks(5).scale(y[d])); })
      .attr('cursor', 'move')
      .call(
        d3.drag()
          .on('start', (event, d) => {
            dragging[d] = x(d);
          })
          .on('drag', (event, d) => {
            // mouse relative position to the PCP region
            const mxy = d3.pointer(event, this.d3a.svg.node());

            // determine the dragging position with referencing the boundary of PCP region
            dragging[d] = Math.min(this.d3a.width, Math.max(0, mxy[0]));
            polylines.attr('d',  path); // re-drawing each instance with the updated axis

            // reordering based on the positional information of each dimension
            this.nameDimensions.sort( (a, b) => position(a) - position(b) );

            x.domain(this.nameDimensions);  // update re-ordered dimensions
            axes.attr('transform', d => 'translate(' + position(d) + ')');  // positioning axis
          })
          .on('end', (event, d) => {
            delete dragging[d]; // remove dragging
            axes.attr('transform', d => 'translate(' + x(d) + ')'); // positioning axis
            polylines.attr('d', path);
          })
      )
      .append('text')
        .attr('transform', 'rotate(90)')  // rotate dimension label
        .style('text-anchor', 'left')
        .attr('y', 9)
        .text(d => d)
        .style('fill', 'black');

      // add axis title
      // .call(g => g.append('text')
      //   .attr('transform', 'rotate(90)')
      //   .style('text-anchor', 'left')
      //   .attr('y', 9)
      //   .text(d => d)
      //   .style('fill', 'black'));
      // .call(g => g.selectAll('text')
      //   .clone(true).lower() //clone and get the lower layer of text as background
      //   .attr('fill', 'none')
      //   .attr('stroke-width', 5)
      //   .attr('stroke-linejoin', 'round')
      //   .attr('stroke', 'white'))


    // implement brushing & linking
    const updateBrushing = () => {
      // d3.event.selection == activeBrushes without key
      if (activeBrushes === null){
        polylines.classed('hidden',false);  // make all lines visible
      }

      polylines.classed('hidden', (d, i) => {
        let key = 0;
        let value_y = 0;
        let active_domain_y = 0;
        /*Checks for each attribute whether the polyline should be drawn by checking whether
          it is in the active area or not */
        for(let dim=0; dim < this.nameDimensions.length; dim++){
          key = this.nameDimensions[dim];
          value_y = y[key](d[key]);
          active_domain_y /*[y0, y1]*/ = activeBrushes.get(key);

          if(active_domain_y != null){
            if(value_y < active_domain_y[0] || value_y > active_domain_y[1]) {
              // change color to gray for the same instance in other chart
              // d3.selectAll('.i' + i + this._parent.rawDataKeyValue[i].Date)
              d3.selectAll('.' + d.EventType + d.Date)
                .filter('circle')
                .style('fill', 'lightgrey')
                .style('opacity', '0.5');
              return true; // not draw
            }
          }
        }
        // change color to original color for the same instance in other chart
        // d3.selectAll('.i' + i + this._parent.rawDataKeyValue[i].Date)
        d3.selectAll('.' + d.EventType + d.Date)
          .filter('circle')
          .style('fill', this.d3a.colorMap[d.EventType])
          .style('opacity', '1.0')
          .raise(); // Changing the order of SVG elements with D3 - selection.raise() and selection.lower()
        return false; // draw
      });
    };

    const brushBegin = (event, attribute) => {
      console.log('brushBegin');
      activeBrushes.set(attribute, event.selection);
      updateBrushing();
    };

    const brushEnd = (event, attribute) => {
      if (event.selection !== null) return;
      console.log('brushEnd');
      activeBrushes.delete(attribute);
      updateBrushing();
    };

    axes.append('g')
      .attr('class', 'brush')
      .call(
        d3.brushY()
          .extent([[-10, 0], [10, this.d3a.height]])
          .on('brush', brushBegin)
          .on('end', brushEnd)
      );
  }

  drawTitle() {
    this.d3a.svg.append('text')
      .attr('x', this.d3a.margin.left * 11)
      .attr('y', -20)
      .attr('text-anchor', 'middle')
      .style('font-family', 'Helvetica')
      .style('font-size', 13)
      .text('PCP ' + this.d3a.title);
  }

  /**
   * drawMenus
   * Drawing chart menus
   * @private
   */
  drawMenus() {
    const menuMargin = this.d3a.margin.left;
    const menuWidth = 30;
    const menuHeight = 10;
    const numMenus = 2;
    const xpos = -5 * this.d3a.gap;
    const ypos = this.d3a.height + 2.5 * menuHeight;

    const fObj = this.d3a.svg.append('foreignObject')
      .attr('x', xpos)
      .attr('y', -40)
      .attr('width', '200px')
      .attr('height', '35px');

    // const fObj = createForeignObj(this.d3a.svg, xpos, -50);
    const div = fObj.append('xhtml:div')
      .append('div')
      .append('g');

    div.append('input')
      .attr('type', 'button')
      .attr('value', 'CLOSE ALL')
      .attr('class', 'btn btn-secondary btn-sm')
      .on('click', this.Close.bind(this));
  }

  Close() {
    // console.log('close: ' + this.uniqueChartIndexKey);
    this._parent.parentRef.removeChild(this.uniqueChartIndexKey);
  }


}


