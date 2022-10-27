import * as d3 from 'd3';
import {UMAP} from 'umap-js';
import {UMAPParameters} from "umap-js/src/umap"; // https://github.com/PAIR-code/umap-js

export class UmapChart {
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

    // Draw elements
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
      .text('UMAP ' + this.title);
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

  render() {
    this.createSVG();
    this.drawPlot();
    this.drawTitle();
    this.drawMenus();

    this.run();
  }

  async run() {
    const range = [-1, 1]; // normalize range

    const UMAPParameters = {learningRate: 1.5, nNeighbors: 30};
    const umap = new UMAP(UMAPParameters);
    const embedding = await umap.fitAsync(this.rawDataKeyValue, epochNumber => {
      // check progress and give user feedback, or return `false` to stop
      if (epochNumber % 50 === 0) {
        // console.log(epochNumber);
        const data = umap.getEmbedding();
        const flattened = [];
        data.forEach( (v) => {
          Array.prototype.push.apply(flattened, v);
        });
        const min = Math.min.apply(null, flattened);
        const max = Math.max.apply(null, flattened);
        const variation = (range[1] - range[0]) / (max - min);
        data.forEach((d, i) => {
          this.dataInstances[i].x = (range[0] + ((d[0]  - min) * variation));
          this.dataInstances[i].y = (range[0] + ((d[1]  - min) * variation));
        });

        // this.dataPos = umap.getEmbedding().map(item => {
        //   item[0] *= 0.3;
        //   item[1] *= 0.3;
        //   return item;
        // });
        this.moveElements();
      }
    });
  }

  private Close() {
    // console.log('close: ' + this.scatterplotkey);
    this.svg.remove();
    this.enabled = false;
    this.parent.DestroyScatterplotCharts();
  }
}
