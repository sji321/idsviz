/**
 * Network Analysis on UMAP scatterplot
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
import {UMAP} from 'umap-js';
import {UMAPParameters} from "umap-js/src/umap"; // https://github.com/PAIR-code/umap-js
import {cloneDeep} from 'lodash';
import {D3ScatterplotComponent} from "../d3-scatterplot/d3-scatterplot.component";

@Component({
  selector: 'app-network-umap-chart',
  templateUrl: './network-umap-chart.component.html',
  styleUrls: ['./network-umap-chart.component.css']
})
export class NetworkUMAPChartComponent extends D3ScatterplotComponent implements OnInit, AfterViewInit {
  public uniqueChartIndexKey;
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
    this.d3a.title = 'UMAP: ' + this._parent.txtDataRange;

    this.d3a.colorMap = this._parent.colormap;
    this.d3a.nameChart = 'svg#' + 'umapchart-' + this.uniqueChartIndexKey;
  }

  ngAfterViewInit() {
    this.init3ScattplotLayout();
    this.drawSettingButton();
    this.drawd3ScattplotLayout();
    this.drawBottomOptions();

    this.runUMAP();
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
      this.dataArray = cloneDeep(this._parent.rawDataValueOnly);
    } else {
      this.dataArray = this.dataArray.map(function(item){
        // remove Date column (located in the 0th variable)
        return item.splice(1, item.length);
      });
    }
    this.runUMAP();
  }

  async runUMAP() {
    const range = [-1, 1]; // normalize range

    const UMAPParameters = {learningRate: 1.5, nNeighbors: 30};
    const umap = new UMAP(UMAPParameters);
    const embedding = await umap.fitAsync(this.dataArray, epochNumber => {
      // check progress and give user feedback, or return `false` to stop
      if (epochNumber % 50 === 0) {
        // console.log(epochNumber);
        const data = umap.getEmbedding();

        // min & max data to be returned
        const arrMinMaxData: any = [];

        // set default min & max value
        arrMinMaxData['x'] = {'min': Number.POSITIVE_INFINITY, 'max': Number.NEGATIVE_INFINITY};
        arrMinMaxData['y'] = {'min': Number.POSITIVE_INFINITY, 'max': Number.NEGATIVE_INFINITY};

        // determine min & max value
        data.forEach((d) => {
          // update min & max value
          arrMinMaxData.x.min = (arrMinMaxData.x.min > d[0]) ? d[0] : arrMinMaxData.x.min;
          arrMinMaxData.x.max = (arrMinMaxData.x.max < d[0]) ? d[0] : arrMinMaxData.x.max;

          // update min & max value
          arrMinMaxData.y.min = (arrMinMaxData.y.min > d[1]) ? d[1] : arrMinMaxData.y.min;
          arrMinMaxData.y.max = (arrMinMaxData.y.max < d[1]) ? d[1] : arrMinMaxData.y.max;
        });

        // normalize -1 ~ +1
        const variationX = (range[1] - range[0]) / (arrMinMaxData.x.max - arrMinMaxData.x.min);
        const variationY = (range[1] - range[0]) / (arrMinMaxData.y.max - arrMinMaxData.y.min);
        data.forEach((d, i) => {
          this.dataInstances[i].x = (range[0] + ((d[0]  - arrMinMaxData.x.min) * variationX));
          this.dataInstances[i].y = (range[0] + ((d[1]  - arrMinMaxData.y.min) * variationY));
        });

        this.moveElements();
      }
    });
  }
}
