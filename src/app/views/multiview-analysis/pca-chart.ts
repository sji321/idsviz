import * as d3 from 'd3';
import {PCA} from 'ml-pca'; // https://github.com/mljs/pca

export class PCAChart {
  private enabled = true;
  private svg;
  private margin = {top: 40, right: 40, bottom: 80, left: 40};
  private gap = 5;  // used for creating axis
  private width = 320 - this.margin.left - this.margin.right; // default
  private height = 320 - this.margin.top - this.margin.bottom; // default
  private title: string;
  private xAxis;
  private yAxis;
  private xAxisScale;
  private yAxisScale;
  private scatterplotName;  // Scatterplot Name
  private scatterplotkey;
  private colormap;
  private rawDataKeyValue;
  private dataInstances;
  private parent; // parent

  constructor(divname: string,
              key: number,
              rawDataKeyValue: any,
              dataInstances: any,
              title: string,
              colormap: any,
              parent: any) {
    this.parent = parent;
    this.scatterplotName = 'svg#' + divname;
    this.scatterplotkey = key;
    this.title = title;
    this.colormap = colormap;
    this.rawDataKeyValue = rawDataKeyValue;
    this.dataInstances = dataInstances;
  }

  public Enabled(){
    return this.enabled;
  }

  private createSVG() {
    this.svg = d3.select(this.scatterplotName + this.scatterplotkey)
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom)
      // .style('background', '#fff6de')
      .style('border', '1px #e0e0e0 dashed')
      .append('g')
      .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');
  }

  private drawPlot() {
    // Add X axis
    this.xAxisScale = d3.scaleLinear()
      .domain([-1, 1])
      .range([0, this.width]);
    this.xAxis = this.svg.append('g')
      .attr('transform', 'translate(0,' + this.height + ')')
      .call(d3.axisBottom(this.xAxisScale));

    // Add Y axis
    this.yAxisScale = d3.scaleLinear()
      .domain([-1, 1])
      .range([this.height, 0]);
    this.yAxis = this.svg.append('g')
      .call(d3.axisLeft(this.yAxisScale));

    // Add a clipPath: everything out of this area won't be drawn.
    const clip = this.svg.append('defs').append('SVG:clipPath')
      .attr('id', 'clip')
      .append('SVG:rect')
      .attr('width', this.width )
      .attr('height', this.height )
      .attr('x', 0)
      .attr('y', 0);

    // draw elements
    this.drawELements();
  }

  private drawELements(){
    // Draw elements

    // // Highlight the specie that is hovered
    // const highlight = (event, d) => {
    //   const selectedGroup = d.EventType;
    //
    //   // first every group turns grey
    //   d3.selectAll('.instance')
    //     .transition().duration(200)
    //     .style('stroke', 'lightgrey')
    //     .style('opacity', '0.2');
    //
    //   // Second the hovered specie takes its color
    //   d3.selectAll('.' + selectedGroup)
    //     .transition().duration(200)
    //     .style('stroke', colormap[selectedGroup])
    //     .style('opacity', '1');
    // };
    //
    // // Unhighlight
    // const doNotHighlight = (event, sd) => {
    //   d3.selectAll('.instance')
    //     .each((data, i, nodes) => {
    //       // @ts-ignore
    //       const et = data.EventType;
    //       d3.select(nodes[i])
    //         .transition().duration(200).delay(500)
    //         .style('stroke', colormap[et])
    //         .style('opacity', '1');
    //     });
    // };

    // Create the scatter variable: where both the circles and the brush take place
    const scatter = this.svg.append('g')
      .attr('clip-path', 'url(#clip)');

    scatter
      .selectAll('dot')
      .data(this.dataInstances)
      .enter()
      .append('circle')
      .attr('class', d => 'instance ' + d.EventType)
      .attr('cx', d => this.xAxisScale(d.x))
      .attr('cy', d => this.yAxisScale(d.y))
      .attr('r', 3)
      .style('opacity', .5)
      .style('fill', (d, i) => this.colormap[d.EventType]);
      // .on('mouseover', highlight)
      // .on('mouseleave', doNotHighlight );

    // Set the zoom and Pan features: how much you can zoom, on which part, and what to do when there is a zoom
    const zoom = d3.zoom()
      .scaleExtent([.5, 20])  // This control how much you can unzoom (x0.5) and zoom (x20)
      .extent([[0, 0], [this.width, this.height]])
      .on('zoom', (e) => {
          const newX = e.transform.rescaleX(this.xAxisScale);
          const newY = e.transform.rescaleY(this.yAxisScale);

          // update axes with these new boundaries
          this.xAxis.call(d3.axisBottom(newX));
          this.yAxis.call(d3.axisLeft(newY));

          // update circle position
          scatter
            .selectAll('circle')
            .attr('cx', (d) => newX(d[0]))
            .attr('cy', (d) => newY(d[1]));
        }
      );

    // This add an invisible rect on top of the chart area.
    // This rect can recover pointer events: necessary to understand when the user zoom
    this.svg.append('rect')
      .attr('width', this.width)
      .attr('height', this.height)
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')')
      .call(zoom);

    // const elements = this.svg.append('g');
    // elements.selectAll('dot')
    //   .data(this.dataPos)
    //   .enter()
    //   .append('circle')
    //   .attr('cx', d => this.xAxisScale(d[0]))
    //   .attr('cy', d => this.yAxisScale(d[1]))
    //   .attr('r', 3)
    //   .style('opacity', .5)
    //   .style('fill', (d, i) => this.color[this.parent.colorAttributes[i]]);
    // .style('fill', d => color(d[2]));
  }

  private moveElements(){
    this.svg.selectAll('circle')
      .data(this.dataInstances)  // Update with new data
      .transition()   // Transition from old to new
      // .delay( (d, i) => (i * 3) )
      .duration(10) // Length of animation
      .attr('cx', d => this.xAxisScale(d.x))
      .attr('cy', d => this.yAxisScale(d.y));
    // console.log('moveElements');
  }

  private drawTitle(){
    this.svg.append('text')
      .attr('x', this.margin.left * 3)
      .attr('y', -20)
      .attr('text-anchor', 'middle')
      .style('font-family', 'Helvetica')
      .style('font-size', 13)
      .text('PCA ' + this.title);
  }

  /**
   * drawMenus
   * Drawing chart menus
   * @private
   */
  private drawMenus() {
    const menuMargin = this.margin.left;
    const menuWidth = 30;
    const menuHeight = 10;
    const numMenus = 2;
    const xpos = -5 * this.gap;
    const ypos = this.height + 2.5 * menuHeight;

    const foreignObject = this.svg.append('foreignObject')
      .attr('x', xpos)
      .attr('y', ypos)
      .attr('width', '100%')
      .attr('height', '100%');

    const div = foreignObject.append('xhtml:div')
      .append('div');

    // div.append('input')
    //   .attr('type', 'button')
    //   .attr('value', 'RUN')
    //   .attr('class', 'btn btn-primary btn-sm')
    //   .on('click', this.runTSNEWorker.bind(this));

    div.append('input')
      .attr('type', 'button')
      .attr('value', 'CLOSE')
      .attr('class', 'btn btn-secondary btn-sm')
      .on('click', this.Close.bind(this));
  }

  private Close() {
    console.log('close: ' + this.scatterplotkey);
    this.parent.parentRef.removeChild(this.scatterplotkey);
  }

  render() {
    this.createSVG();
    this.drawPlot();
    this.drawTitle();
    this.drawMenus();

    this.run();
  }

  async run() {
    const range = [-1, 1]; // normalize range

    const pca = new PCA(this.rawDataKeyValue);
    // console.log(pca.getExplainedVariance());
    // console.log(pca.predict(this.parent.rawDataKeyValue));

    const data = pca.predict(this.rawDataKeyValue);

    const col0 = data.getColumn(0);
    const col1 = data.getColumn(1);

    const col0minmax = [Math.min(...col0), Math.max(...col0)];
    const col1minmax = [Math.min(...col1), Math.max(...col1)];

    // update PCA position
    // const normData: number[] = [];
    const variation0 = (range[1] - range[0]) / (col0minmax[1] - col0minmax[0]);
    const variation1 = (range[1] - range[0]) / (col1minmax[1] - col1minmax[0]);
    for (let i = 0; i < col0.length; i++) {
      const tmp = [(range[0] + ((col0[i]  - col0minmax[0]) * variation0)),
              (range[0] + ((col1[i]  - col1minmax[0]) * variation1))];
      // normData.push(tmp);
      this.dataInstances[i].x = (range[0] + ((col0[i]  - col0minmax[0]) * variation0));
      this.dataInstances[i].y = (range[0] + ((col1[i]  - col1minmax[0]) * variation1));
    }
    // this.dataPos = normData;

    // const variation0 = (range[1] - range[0]) / (col0minmax[1] - col0minmax[0]);
    // col0.forEach((item, index) => {
    //   col0[index] = (range[0] + ((item  - col0minmax[0]) * variation0));
    // });
    //
    // const variation1 = (range[1] - range[0]) / (col1minmax[1] - col1minmax[0]);
    // col1.forEach((item, index) => {
    //   col1[index] = (range[0] + ((item  - col1minmax[0]) * variation1));
    // });

    // const newdata = col0.concat(col1);

    // col0.push(...col1);

    // const newdatax = [...col0, ...col1];

    //
    // let resultsObject = {firstValue: maxFirstValue, secondValue: maxSecondValue}
    //
    // const res = Object.keys(data)
    //   .map((obj) => Object.values(obj).slice(1, 5))
    //   .reduce((acc, el) => acc.map((max, i) => Math.max(max, el[i])), [0, 0, 0, 0])
    //
    // const flattened = [];
    // data.forEach( (v) => {
    //   Array.prototype.push.apply(flattened, v);
    // });
    // const min = Math.min.apply(null, flattened);
    // const max = Math.max.apply(null, flattened);
    // const variation = (range[1] - range[0]) / (max - min);
    // data.forEach(item => {
    //   item[0] = (range[0] + ((item[0]  - min) * variation));
    //   item[1] = (range[0] + ((item[1]  - min) * variation));
    // });
    // this.dataPos = data;

    // this.dataPos = umap.getEmbedding().map(item => {
    //   item[0] *= 0.3;
    //   item[1] *= 0.3;
    //   return item;
    // });
    this.moveElements();

  }

}

// test(){
//   // const dataset = require('ml-dataset-iris').getNumbers();
// // dataset is a two-dimensional array where rows represent the samples and columns the features
//   const dataset = null;
//   const pca = new PCA(dataset);
//   console.log(pca.getExplainedVariance());
//   /*
//   [ 0.9246187232017269,
//     0.05306648311706785,
//     0.017102609807929704,
//     0.005212183873275558 ]
//   */
//   const newPoints = [
//     [4.9, 3.2, 1.2, 0.4],
//     [5.4, 3.3, 1.4, 0.9],
//   ];
//
//   //https://github.com/mljs/pca
// }
