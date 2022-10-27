/**
 * Network Analysis on tSNE scatterplot
 * Author: Dong H Jeong
 * Initial: 3/29/2022
 *
 *
 */

import {AfterViewInit, Component, OnInit} from '@angular/core';
import * as d3 from 'd3';
import {
  addEmptySpace,
  addHTMLText, createButton,
  createCheckbox, createForeignObj,
  D3ChartAttributes,
  initD3ChartAttributes,
  updateD3ChartSize
} from "../../d3ChartAttributes";
import {UserInteractionService} from "../../user-interaction.service";
import {MultiviewAnalysisComponent} from "../multiview-analysis.component";
import {cloneDeep} from 'lodash';
import {D3ScatterplotComponent} from "../d3-scatterplot/d3-scatterplot.component";

@Component({
  selector: 'app-network-tsne-chart',
  templateUrl: './network-tsne-chart.component.html',
  styleUrls: ['./network-tsne-chart.component.css']
})
export class NetworkTSNEChartComponent extends D3ScatterplotComponent implements OnInit, AfterViewInit {
  public uniqueChartIndexKey;
  private TSNEWorker;
  private TSNEModelStarted = false;
  private iter = 0;
  private dateChecked = true;

  btnSetting: any; // button

  constructor(private _parent: MultiviewAnalysisComponent,
              private uiService: UserInteractionService) {
    super(); // calling parent constructor
  }

  override ngOnInit(): void {
    this.uniqueChartIndexKey = this._parent.uniqueChartIndexKey;
    this.dataInstances = cloneDeep(this._parent.dataInstances); // duplicate selected variables
    this.dataArray = cloneDeep(this._parent.rawDataValueOnly);

    // initialize d3 chart attributes
    this.d3a = initD3ChartAttributes();
    this.d3a.margin = {top: 40, right: 40, bottom: 70, left: 40};
    this.d3a = updateD3ChartSize(this.d3a, 320, 320);
    this.d3a.title = 'tSNE: ' + this._parent.txtDataRange;

    this.d3a.colorMap = this._parent.colormap;
    this.d3a.nameChart = 'svg#' + 'tsnechart-' + this.uniqueChartIndexKey;
  }

  ngAfterViewInit() {
    this.init3ScattplotLayout();
    this.drawSettingButton();
    this.drawd3ScattplotLayout();
    this.drawBottomOptions();

    this.runTSNEWorker();
  }

  drawSettingButton(){
    this.btnSetting = createForeignObj(this.d3a.svg, this.d3a.width + 2, -40);
    const div = this.btnSetting.append('xhtml:div')
      .append('div');

    createButton(div,
      '<i class="fa fa-cog"></i>', 'btn-link').on(
      'click', () => {
        console.log('x');
      }
    );
  }

  drawBottomOptions() {
    const menuHeight = 10;
    const xpos = -5 * this.d3a.gap;
    const ypos = this.d3a.height + 2.5 * menuHeight;

    const fObj = createForeignObj(this.d3a.svg, xpos, ypos);
    const div = fObj.append('xhtml:div')
      .append('div');
    createCheckbox(div, '&nbsp;<span style="font-size: 9pt;">Date</span>').on(
      'change',
      this.clickDateCheckBox.bind(this)
    )
  }

  clickDateCheckBox() {
    this.dateChecked = !this.dateChecked;
    if (this.dateChecked === true){
      // this.dataArray.splice(0, this.dataArray.length);
      this.dataArray = cloneDeep(this._parent.rawDataValueOnly);
    } else {
      this.dataArray = this.dataArray.map(function(item){
        // remove Date column (located in the 0th variable)
        return item.splice(1, item.length);
      });
    }
    this.runTSNEWorker();
  }

  initTSNE(){
    this.TSNEModelStarted = false;

    if (typeof Worker !== 'undefined') {
      this.TSNEWorker = new Worker(new URL('./tsne-chart.worker', import.meta.url));
    }

    // setting the data
    this.TSNEWorker.postMessage({
      type: 'TSNE_INPUT_DATA',
      dataset: this.dataArray
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

  runTSNEWorker() {
    this.initTSNE();

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
}
