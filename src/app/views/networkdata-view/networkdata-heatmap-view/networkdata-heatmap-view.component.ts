import {AfterViewInit, Component, OnInit} from '@angular/core';
import * as d3 from 'd3';
import { Matrix } from 'ml-matrix'; // https://github.com/mljs/matrix

@Component({
  selector: 'app-networkdata-heatmap-view',
  templateUrl: './networkdata-heatmap-view.component.html',
  styleUrls: ['./networkdata-heatmap-view.component.css']
})
export class NetworkdataHeatmapViewComponent implements OnInit, AfterViewInit {
  private svg;
  // set the dimensions and margins of the graph
  private margin = {top: 80, right: 25, bottom: 30, left: 40};
  private width = 450 - this.margin.left - this.margin.right;
  private height = 450 - this.margin.top - this.margin.bottom;
  private data: any;

  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.data = new Array();

    for (let hr = 1; hr <= 24; hr++){
      let item = {
        'hour': hr,
        'value': Math.random()
      };
      this.data.push(item);
    }

    this.createSVG();
    this.drawHeatmap();
  }

  private createSVG() {
    this.svg = d3.select('#heatmapVIZ')
      .append("svg")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);
  }

  private drawHeatmap() {
    // Build X scales and axis:
    const x = d3.scaleBand()
      .range([ 0, this.width ])
      .domain([1, 6])
      .padding(0.05);

    this.svg.append("g")
      .style("font-size", 15)
      .attr("transform", `translate(0, ${this.height})`)
      .call(d3.axisBottom(x).tickSize(0))
      .select(".domain").remove()

    // Build Y scales and axis:
    const y = d3.scaleBand()
      .range([ this.height, 0 ])
      .domain([1, 4])
      .padding(0.05);

    this.svg.append("g")
      .style("font-size", 15)
      .call(d3.axisLeft(y).tickSize(0))
      .select(".domain").remove()

    // Build color scale
    const heatmapColor = d3.scaleSequential()
      .interpolator(d3.interpolateInferno)
      .domain([0, 1]) // 0 ~ 1.0

    // add the squares
    this.svg.selectAll()
      .data(this.data, function(i, d) {return i;})
      .join("rect")
      .attr("x", function(i, d) { return i; })
      .attr("y", function(i, d) { return d.hr; })
      .attr("rx", 4)
      .attr("ry", 4)
      .attr("width", x.bandwidth() )
      .attr("height", y.bandwidth() )
      .style("fill", function(d) { return heatmapColor(d.get(d.value))} )
      .style("stroke-width", 4)
      .style("stroke", "none")
      .style("opacity", 0.8);
      // .on("mouseover", mouseover)
      // .on("mousemove", mousemove)
      // .on("mouseleave", mouseleave);

  }
}
