// reference: https://www.d3-graph-gallery.com/graph/parallel_custom.html
import * as d3 from 'd3';

export class PCPChart {
  private enabled = true;
  private svg;
  // private margin = 40;  // used for creating axis
  private margin = {top: 40, right: 40, bottom: 80, left: 80};
  private gap = 5;  // used for creating axis
  private width = 550 - this.margin.left - this.margin.right; // default
  private height = 320 - this.margin.top - this.margin.bottom; // default
  private dataInstances;
  private dimensions;
  private title: string;
  private xAxisScale;
  private yAxisScale;
  private scatterplotName;  // Scatterplot Name
  private scatterplotkey;
  private parent; // parent
  private label = {height: 9, width: 50};
  private colormap;

  constructor(divname: string,
              key: number,
              selectedVariables: string[],
              dataInstances: any,
              title: string,
              colormap: any,
              parent: any) {
    this.parent = parent;
    this.scatterplotName = 'svg#' + divname;
    this.scatterplotkey = key;
    this.title = title;
    this.colormap = colormap;
    this.dimensions = selectedVariables;
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
    const y = {};
    for (let col = 0; col < this.dimensions.length; col++) {
      y[this.dimensions[col]] = d3.scaleLinear()
        .domain( this.parent.rawDataMinMax[col] ) // --> Same axis range for each group
        // --> different axis range for each group --> .domain( [d3.extent(data, function(d) { return +d[name]; })] )
        .range([this.height, 0]);
    }

    // Build the X scale -> it find the best position for each Y axis
    const x = d3.scalePoint()
      .range([0, this.width])
      .domain(this.dimensions);

    // The path function take a row of the csv as input, and return x and y coordinates of the line to draw for this raw.
    const path = (d) => d3.line()(this.dimensions.map( (p, i) => [x(p), y[p](d[i])]));

    // Highlight the specie that is hovered
    const highlight = (event, d) => {
      const selectedGroup = d.EventType;

      // first every group turns grey
      d3.selectAll('.instance')
        .transition().duration(200)
        .style('stroke', 'lightgrey')
        .style('opacity', '0.2');

      // Second the hovered specie takes its color
      d3.selectAll('.' + selectedGroup)
        .transition().duration(200)
        .style('stroke', this.colormap[selectedGroup])
        .style('opacity', '1');
    };

    // Unhighlight
    const doNotHighlight = (event, sd) => {
      d3.selectAll('.instance')
        .each((data, i, nodes) => {
          // @ts-ignore
          const et = data.EventType;
          d3.select(nodes[i])
            .transition().duration(200).delay(500)
            .style('stroke', this.colormap[et])
            .style('opacity', '1');
      });
    };

    // Draw the lines
    this.svg
      .selectAll(this.scatterplotName + this.scatterplotkey + 'myPath')
      // .data(this.parent.rawDataKeyValue)
      .data(this.dataInstances)
      .enter()
      .append('path')
      .attr('class', d => 'instance ' + d.EventType) // 2 class for each line: 'line' and the group name
      .attr('d', path)
      .style('fill', 'none' )
      .style('stroke', d => this.colormap[d.EventType])
      .style('opacity', 0.5)
      .on('mouseover', highlight)
      .on('mouseleave', doNotHighlight );

    // Draw the axis:
    this.svg.selectAll(this.scatterplotName + this.scatterplotkey + 'Axis')
      // For each dimension of the dataset, add a 'g' element:
      .data(this.dimensions).enter()
      .append('g')
        .attr('class', 'axis')
        // Translate this element to its right position on the x axis
        .attr('transform', (d) => 'translate(' + x(d) + ')')
        // Build the axis with the call function
      // @ts-ignore
        .each(function(d) { d3.select(this).call(d3.axisLeft(this.yAxisScale).ticks(5).scale(y[d])); })
        // Add axis title
      .append('text')
        .style('text-anchor', 'middle')
        .attr('y', (d, i) => ((i % 2 === 0) ? -this.label.height : this.height + this.label.height))
        .text((d) => d)
        .style('fill', 'red');
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

    // this.run();
  }

}
