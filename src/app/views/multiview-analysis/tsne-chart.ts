import * as d3 from 'd3';
import * as tf from '@tensorflow/tfjs-core';
import * as tf_tsne from '@tensorflow/tfjs-tsne';
import TSNE from 'tsne-js';

export class TsneChart {
  private enabled = true;
  private svg;

  private margin = {top: 40, right: 40, bottom: 80, left: 40};
  private gap = 5;  // used for creating axis
  private width = 320 - this.margin.left - this.margin.right; // default
  private height = 320 - this.margin.top - this.margin.bottom; // default
  private title: string;
  private TSNEModelStarted = false;
  private xAxis;
  private yAxis;
  private xAxisScale;
  private yAxisScale;
  private scatterplotName;  // Scatterplot Name
  private scatterplotkey;
  private parent; // parent
  private TSNEWorker;
  private TSNEModel;
  private colormap;
  private iter = 0;
  private rawDataKeyValue;
  private dataInstances;

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

    // const elements = this.svg.append('g');
    // elements.selectAll('dot')
    //   .data(this.dataPos)
    //   .enter()
    //   .append('circle')
    //   .attr('cx', d => this.xAxis(d[0]))
    //   .attr('cy', d => this.yAxis(d[1]))
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
      .text('t-SNE ' + this.title);
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

  private initTSNE(){
    if (typeof Worker !== 'undefined') {
      this.TSNEWorker = new Worker(new URL('./tsne-chart.worker', import.meta.url));

      // setting the data
      this.TSNEWorker.postMessage({
        type: 'TSNE_INPUT_DATA',
        dataset: this.rawDataKeyValue
      });

      // setting the message processing
      this.TSNEWorker.onmessage = ({ data }) => {
        // const msg = data.data;
        // console.log(data);

        switch (data.type) {
          case 'TSNE_PROGRESS_STATUS':
            // $('#progress-status').text(msg.data);
            break;
          case 'TSNE_PROGRESS_ITER':
            // $('#progress-iter').text(msg.data[0] + 1);
            // $('#progress-error').text(msg.data[1].toPrecision(7));
            // $('#progress-gradnorm').text(msg.data[2].toPrecision(5));
            break;
          case 'TSNE_PROGRESS_DATA':
            this.iter++;
            if (this.iter % 10 === 0) {
              data.pdata.map( (d, i) => {
                this.dataInstances[i].x = d[0]; // update positional information
                this.dataInstances[i].y = d[1]; // update positional information
              });
              this.moveElements();
            }
            break;
          case 'TSNE_DONE':
            data.pdata.map( (d, i) => {
              this.dataInstances[i].x = d[0]; // update positional information
              this.dataInstances[i].y = d[1]; // update positional information
            });
            this.moveElements();
            this.TSNEModelStarted = false;
            break;
          default:
        }
      };
    }
  }

  private runTSNEWorker() {
    if (this.TSNEModelStarted) {
      return; // TSNE started already
    }
    this.TSNEModelStarted = true;

    // start running T-SNE
    this.TSNEWorker.postMessage({
      type: 'TSNE_RUN',
      attributes: {
        perplexity: 30,
        earlyExaggeration: 4.0,
        learningRate: 100.0,
        nIter: 300,
        metric: 'euclidean'
      }
    });
  }

  render() {
    this.createSVG();
    this.drawPlot();
    this.drawTitle();
    this.drawMenus();

    this.initTSNE();
    this.runTSNEWorker();

    // this.tsneTest();
    // this.tfTSNE();
  }

  async tfTSNE() {
    const numDimensions = 20;
    const numPoints = 5000;

    // const data = this.generateData(numDimensions, numPoints);
    // await this.computeEmbedding(data, numPoints);

    const d2 = tf.tensor(this.rawDataKeyValue);
    await this.computeEmbedding(d2);
  }

  /*
 * Generate some synthetic data to demonstrate the T-SNE implementation.
 *
 * The data is drawn from a straight line in the high dimensional space to which
 * random noise is added. The data must be a rank 2 tensor.
 */
  generateData(numDimensions, numPoints) {
    const data = tf.tidy(() => {
      return tf.linspace(0, 1, numPoints * numDimensions)
        .reshape([numPoints, numDimensions])
        .add(tf.randomUniform([numPoints, numDimensions]));
    });
    return data;
  }

  /*
   * Computes our embedding.
   *
   * This runs the T-SNE algorithm over our data tensor
   * and returns x,y coordinates in embedding space.
   *
   */
  async computeEmbedding(data) {
    const embedder = tf_tsne.tsne(data, {
      perplexity: 30,
      verbose: false, // show log
      knnMode: 'auto',
    });

    // Get the suggested number of iterations to perform.
    const knnIterations = embedder.knnIterations();
    // Do the KNN computation. This needs to complete before we run tsne
    for(let i = 0; i < knnIterations; ++i){
      await embedder.iterateKnn();
      // You can update knn progress in your ui here.
    }

    const tsneIterations = 1000;
    for(let i = 0; i < tsneIterations; ++i){
      await embedder.iterate();
      // Draw the embedding here...

      if (i % 100 === 0) {
        // const coordinates = await embedder.coordinates();
        // const numberPoints = coordinates.shape[0];
        const coordData = await embedder.coordinates().data();

        for (let i = 0; i < this.dataInstances.length; i++) {
          const xcoord = coordData[i * 2];
          const ycoord = coordData[i * 2 + 1];
          // @ts-ignore
          this.dataInstances.x = xcoord;
          this.dataInstances.y = ycoord;
        }
        this.moveElements();
        // console.table(coordData);
      }
    }
    // Get the normalized coordinates of the data
    // return await embedder.coordsArray();
  }

  async tsneTest() {
    // this.TSNEModel = new TSNE({
    //   dim: 2,
    //   perplexity: 30.0,
    //   earlyExaggeration: 4.0,
    //   learningRate: 100.0,
    //   nIter: 300,
    //   metric: 'euclidean'
    // });
    //
    // this.TSNEModel.init({
    //   data: this.parent.rawDataKeyValue, // allocate data
    //   type: 'dense'
    // });
    //
    // this.TSNEModel.run();
    //
    // this.TSNEModel.on('progressData', (pdata) => {
    //   pdata.map( (d, i) => {
    //     this.dataInstances[i].x = d[0];
    //     this.dataInstances[i].y = d[1];
    //   });
    //   this.moveElements();
    // });
  }

  private Close() {
    // console.log('close: ' + this.scatterplotkey);
    this.svg.remove();
    this.enabled = false;
    this.parent.DestroyScatterplotCharts();

    // this.scatterplotName + this.scatterplotkey
    // this.parent.parentRef.removeChild(this.scatterplotkey);
  }
}

// if (typeof Worker !== 'undefined') {
//   // Create a new
//   const worker = new Worker(new URL('./tsne-chart.worker', import.meta.url));
//   worker.onmessage = ({ data }) => {
//     console.log(`page got message: ${data}`);
//   };
//   worker.postMessage('hello');
// } else {
//   // Web Workers are not supported in this environment.
//   // You should add a fallback so that your program still executes correctly.
// }
