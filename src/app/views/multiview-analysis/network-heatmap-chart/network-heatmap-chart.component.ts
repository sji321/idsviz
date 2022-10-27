/**
 * Network Analysis on Heatmap
 * Author: Dong H Jeong
 * Initial: 9/16/2022
 *
 *
 */
import {AfterViewInit, Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {UserInteractionService} from "../../user-interaction.service";
import {cloneDeep} from 'lodash';
import {MultiviewAnalysisComponent} from "../multiview-analysis.component";
import {
  createButton,
  createForeignObj,
  D3ChartAttributes,
  initD3ChartAttributes,
  updateD3ChartSize
} from "../../d3ChartAttributes";
import * as d3 from 'd3';
import {SLHeatmap} from "../../../database/interfaces";

@Component({
  selector: 'app-network-heatmap-chart',
  templateUrl: './network-heatmap-chart.component.html',
  styleUrls: ['./network-heatmap-chart.component.css']
})
export class NetworkHeatmapChartComponent implements OnInit, AfterViewInit {
  @ViewChild('PCPAttributeSelectionDialog', { read: TemplateRef }) PCPAttributeDlgTemplateTemplate:TemplateRef<any>;
  public d3a: D3ChartAttributes;
  public uniqueChartIndexKey;
  // public enabled = false;
  private selectedAttribute;
  private selectedEventType = 'N'; // N: Normal / A: Abnormal
  private availableAttributes; // cloned dimensions are created because re-ordering is supported
  private data;

  btnSetting: any; // button
  modalSettingDlg: any; // modal dialog (settings)

  constructor(private _parent: MultiviewAnalysisComponent,
              private uiService: UserInteractionService) { }

  ngOnInit(): void {
    this.uniqueChartIndexKey = this._parent.uniqueChartIndexKey;
    this.availableAttributes = ['Date', ...this._parent.nameDimensions];//cloneDeep(this._parent.nameDimensions);
    // this.data = this._parent.rawDataKeyValue;
    // this.data = cloneDeep(this._parent.rawDataKeyValue);
    // this.data.forEach(function(x){delete x.Date});  // remove Date variable

    this.UpdateValues();

    // initialize d3 chart attributes
    this.d3a = initD3ChartAttributes();
    this.d3a.margin = {top: 40, right: 40, bottom: 40, left: 20};
    this.d3a = updateD3ChartSize(this.d3a, 810, 320);
    this.d3a.title =  this._parent.txtDataRange;
    this.d3a.colorMap = this._parent.colormap;
    this.d3a.nameChart = 'svg#' + 'heatmapchart-' + this.uniqueChartIndexKey;
  }

  ngAfterViewInit() {
    this.drawAllElements();
  }

  drawAllElements() {
    this.createSVG();
    this.drawSettingButton();
    this.drawHeatmap();
    this.drawTitle();
    this.drawAttributeSelectionMenu();
    this.drawEventTypeSelectionMenu();
    this.drawAttributeValue();
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

  drawSettingButton(){
    this.btnSetting = createForeignObj(this.d3a.svg, this.d3a.width + 5, -40);
    const div = this.btnSetting.append('xhtml:div')
      .append('div');

    createButton(div,
      '<i class="fa fa-cog"></i>', 'btn-link').on(
      'click', () => {

        // open modal dialog
        // this.modalSettingDlg = this.modalDlgService.open(this.PCPAttributeDlgTemplateTemplate, {size: 'sm', ariaLabelledBy: 'modal-basic-title', centered: true});
      }
    );
  }

  drawTitle() {
    this.d3a.svg.append('text')
      .attr('x', this.d3a.margin.left * 6)
      .attr('y', -20)
      .attr('text-anchor', 'middle')
      .style('font-family', 'Helvetica')
      .style('font-size', 10)
      .text('Heatmap ' + this.d3a.title);
  }

  drawHeatmap(){

    // Labels of row and columns -> unique identifier of the column called 'group' and 'variable'
    const horizontalMintues = Array.from(Array(60).keys()) // 0 ~ 59
    const verticalHours = Array.from(Array(24).keys()) // 0 ~ 23

    // Build X scales and axis:
    const x = d3.scaleBand()
      .range([ 0, this.d3a.width ])
      .domain(horizontalMintues)
      .padding(0.01);
    this.d3a.svg.append("g")
      .style("font-size", 9)
      .attr("transform", `translate(0, ${this.d3a.height})`)
      .call(d3.axisBottom(x).tickSize(0))
      .select(".domain").remove()

    // Build Y scales and axis:
    const y = d3.scaleBand()
      .range([ this.d3a.height, 0 ])
      .domain(verticalHours)
      .padding(0.01);
    this.d3a.svg.append("g")
      .style("font-size", 9)
      .call(d3.axisLeft(y).tickSize(0))
      .select(".domain").remove()

    // Build color scale
    // const heatmapColor = d3.scaleSequential()
    //   .interpolator(d3.interpolateInferno)
    //   .domain([this.dataMinMax.min, this.dataMinMax.max])
    // const heatmapColor = d3.scaleLinear()
    //   // .range(["white", "#e34a33"])
    //   .range(["white", "#ff0000"])
    //   .domain([0, this._parent.rawDataMinMax[this.selectedAttribute].max])

    let heatmapColor;
    if (this.selectedEventType == 'N') {
      heatmapColor = d3.scaleLinear()
        // .range(["white", "#e34a33"])
        .range(['#d8e5ef', this.d3a.colorMap['N']])
        .domain([0, this._parent.rawDataMinMax[this.selectedAttribute].max])
    } else {
      heatmapColor = d3.scaleLinear()
        // .range(["white", "#e34a33"])
        .range(['#e3c0c1', this.d3a.colorMap['A']])
        .domain([0, this._parent.rawDataMinMax[this.selectedAttribute].max])
    }


      // Three function that change the tooltip when user hover / move / leave a cell
    const mouseover = function(event,d) {
      d3.select('.HM' + d.row + '_' + d.col)
        .style("stroke", "black")
        .style("opacity", 1)
    }
    const mousemove = function(event,d) {
      d3.select('.HMVALUE')
        .attr('value', 'hr: ' + d.row + ', min: ' + d.col + ', val: ' + d.val);
    }
    const mouseleave = function(event,d) {
      d3.select('.HM' + d.row + '_' + d.col)
        .style("stroke", "none")
        .style("opacity", 0.8)
    }

    // convert data format to make it mapped easily to heatmap
    let dataMap = Array();
    for (let row=0; row < 24; row++) {
      for (let col=0; col < 60; col++) {
        dataMap.push({
          'row': row,
          'col': col,
          'val': this.data[row][col]
        });
      }
    }

    // add the squares
    this.d3a.svg.selectAll()
      .data(dataMap)
      .join("rect")
      .attr('class', d => 'HM' + d.row + '_' + d.col)  // assign each instance (rect) with row, col information
      .attr("x", function(d) { return x(d.col); })
      .attr("y", function(d) { return y(d.row); })
      // .attr("rx", 4)
      // .attr("ry", 4)
      .attr("width", x.bandwidth() )
      .attr("height", y.bandwidth() )
      .style("fill", function(d, i) {
        if (d.val <= 0)
          return '#f0f0f0';
        return heatmapColor(d.val)
      } )
      // .style("stroke-width", 4)
      // .style("stroke", "none")
      // .style("opacity", 0.8)
      .on("mouseover", mouseover)
      .on("mousemove", mousemove)
      .on("mouseleave", mouseleave)
  }

  drawAttributeValue() {
    const menuMargin = this.d3a.margin.left;
    const menuWidth = 30;
    const menuHeight = 10;
    const numMenus = 2;
    const xpos = this.d3a.width / 3 + 10 * this.d3a.gap;
    const ypos = this.d3a.height + 2.5 * menuHeight;

    const fObj = this.d3a.svg.append('foreignObject')
      .attr('x', xpos)
      .attr('y', -35)
      .attr('width', '150px')
      .attr('height', '35px');

    // const fObj = createForeignObj(this.d3a.svg, xpos, -50);
    const div = fObj.append('xhtml:div')
      .append('div')
      .append('g');

    div.append('input')
      .attr('type', 'text')
      .attr('class', 'HMVALUE btn btn-sm')
      .attr('value', 'value: 0.00')
      .style('font-size', '9pt')
      .style('padding', '0')
      .style('margin', '0')
      .style('width', '150px')
  }

  drawAttributeSelectionMenu() {
    const menuMargin = this.d3a.margin.left;
    const menuWidth = 30;
    const menuHeight = 10;
    const numMenus = 2;
    const MenuWidth = 230;
    const xpos = this.d3a.width - MenuWidth;
    const ypos = this.d3a.height + 2.5 * menuHeight;

    const fObj = this.d3a.svg.append('foreignObject')
      .attr('x', xpos)
      .attr('y', -35)
      .attr('width', MenuWidth)
      .attr('height', '35px');

    // const fObj = createForeignObj(this.d3a.svg, xpos, -50);
    const div = fObj.append('xhtml:div')
      .append('div')
      .append('g');

    const select = div.append('select')
      .style('font-size', '9pt')
      // .attr('class', 'btn btn-success btn-sm')
      // .on('change', this.VariableChange.bind(this));
      .on('change', () => {
        this.selectedAttribute = select.property('value');
        this.UpdateValues();

        this.d3a.svg.remove();
        this.drawAllElements();
      });

    this.availableAttributes.forEach( (item) => {
      if (item !== 'Date') {
        select.append('option')
          .text(item)
          .attr('value', item)
          .style('font-size', '9pt')
          .attr('selected', () => {
            if (item == this.selectedAttribute)
              return true;
            return;
          } )
      }
    });
  }

  drawEventTypeSelectionMenu() {
    const menuMargin = this.d3a.margin.left;
    const menuWidth = 30;
    const menuHeight = 10;
    const numMenus = 2;
    const MenuWidth = 80;
    const xpos = this.d3a.width - MenuWidth;
    const ypos = this.d3a.height + 2.5 * menuHeight;

    const fObj = this.d3a.svg.append('foreignObject')
      .attr('x', xpos)
      .attr('y', -35)
      .attr('width', MenuWidth)
      .attr('height', '35px');

    // const fObj = createForeignObj(this.d3a.svg, xpos, -50);
    const div = fObj.append('xhtml:div')
      .append('div')
      .append('g');

    const select = div.append('select')
      .style('font-size', '9pt')
      // .attr('class', 'btn btn-success btn-sm')
      // .on('change', this.VariableChange.bind(this));
      .on('change', () => {
        this.selectedEventType = select.property('value');
        this.UpdateValues();

        this.d3a.svg.remove();
        this.drawAllElements();
      });

    // Normal event option
      select.append('option')
        .text('Normal')
        .attr('value', 'N')
        .style('font-size', '9pt')
        .attr('selected', () => {
          if (this.selectedEventType == 'N')
            return true;
          return;
        });

    // abnormal event option
    select.append('option')
      .text('Abnormal')
      .attr('value', 'A')
      .style('font-size', '9pt')
      .attr('selected', () => {
        if (this.selectedEventType == 'A')
          return true;
        return;
      });

  }

  UpdateValues() {
    if (this.selectedAttribute == undefined) {
      this.selectedAttribute = this.availableAttributes[1]; // set default variable
    }

    this.data = Array.from({length: 24}, () => Array.from({length: 60}, () => 0));
    const counts = Array.from({length: 24}, () => Array.from({length: 60}, () => 0));

    this._parent.rawDataKeyValue.forEach((item) => {
      const date = new Date(+item.Date); // convert UNIX timestamp to time in JavaScript
      const hour = date.getHours();
      const minute = date.getMinutes();
      if (this.selectedEventType == item.EventType) { // 'N' vs 'A'
        this.data[hour][minute] = item[this.selectedAttribute];
        counts[hour][minute]++; // check how many elements
      }
    });

    // compute average values
    for (let hour = 0; hour < 24; hour++) {
      for (let min = 0; min < 60; min++) {
        if (counts[hour][min] > 1) {
          this.data[hour][min] = this.data[hour][min] / counts[hour][min];
        }
      }
    }


  }

}
