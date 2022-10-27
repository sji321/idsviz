import {AfterViewInit, Component, ElementRef, OnInit, ViewChild, Output} from '@angular/core';
import {NetworkdataViewComponent} from '../networkdata-view/networkdata-view.component';
import * as moment from 'moment';
import {DataManagementService} from '../../database/data-management.service';
import {UserInteractionService} from "../user-interaction.service";
import {cloneDeep} from 'lodash';

@Component({
  selector: 'app-multiview-analysis',
  templateUrl: './multiview-analysis.component.html',
  styleUrls: ['./multiview-analysis.component.css']
})

export class MultiviewAnalysisComponent implements OnInit, AfterViewInit  {
  public uniqueChartIndexKey: number;
  public parentRef: NetworkdataViewComponent;
  // public colorAttributes: any; // color attributes for the network events

  public rawDataMinMax;  // min & max in each dimension
  public nameDimensions;  // name of each dimension
  public dataRange;
  public txtDataRange: string;
  public colormap: {[key: string]: string};
  public dataInstances;                 // random data point (x, y) + event type indicator (normal / abnormal)
  // public dataNetworkEvents;             // selected network events data + event type indicator (normal / abnormal)
  public rawDataKeyValue;    // selected network events raw data
  public rawDataValueOnly;    // selected network events raw data
  public selectedNetworkEventsRawDataValues;

  public PCPChartEnabled = true;
  public PCAChartEnabled = true;
  public UMAPChartEnabled = true;
  public TSNEChartEnabled = true;
  public HeatmapEnabled = true;

  constructor(private dmService: DataManagementService,
              private uiService: UserInteractionService) { }

  ngOnInit() {
    // Color scale: give me a specie name, I return a color
    this.colormap = {
      N: '#2c7bb6',
      A: '#d7191c'
    };

    this.txtDataRange = ' ['
      + moment(this.dataRange[0]).format('YYYY-MM-DD HH:mm') + ' ~ '
      + moment(this.dataRange[1]).format('YYYY-MM-DD HH:mm') + ']';

    this.nameDimensions = this.dmService.selectedVariables;

    // set random data position
    this.dataInstances = new Array();
    for (let i = 0; i < this.rawDataKeyValue.length; i++) {
      const tmp: {[key: string]: any} = {
        'x': 2 * Math.random() - 1.0,
        'y': 2 * Math.random() - 1.0,
        'EventType': this.rawDataKeyValue[i].EventType,
        'Date': this.rawDataKeyValue[i].Date
      };
      this.dataInstances.push(tmp);
    };

    // const tmp = cloneDeep(this.rawDataKeyValue);
    // tmp.forEach(function(x){ delete x.Date; delete x.EventType; });  // remove Date & EventType variables
    // this.selectedNetworkEventsRawDataValues = Object.values(tmp);

    // Object.values(numbers);


    // this.rawDataKeyValue
    // combined data - network events + event type
    // adding event type (normal and abnormal) at the end of each instance
    // this.dataNetworkEvents = new Array();
    // for (var i = 0; i < this.rawDataKeyValue.length; i++) {
    //   const tmp: {[key: string]: any} = {};
    //   this.nameDimensions.forEach( (dimension, index) => {
    //     tmp[dimension] =  this.rawDataKeyValue[i][index];
    //   });
    //
    //   // const tmp = {...this.rawDataKeyValue[i]};
    //   // tmp['EventType'] = (this.colorAttributes[i] === 0) ? 'N' : 'A';
    //   this.dataNetworkEvents.push(tmp);
    // };

  }

  ngAfterViewInit() {

    // this.PCPChartEnabled = true;

    // this.txtDataRange = ' ['
    //   + moment(this.dataRange[0]).format('YYYY-MM-DD h:mm') + ' ~ '
    //   + moment(this.dataRange[1]).format('YYYY-MM-DD h:mm') + ']';
    //
    // // set random data position
    // this.dataInstances = new Array();
    // for (let i = 0; i < this.rawDataKeyValue.length; i++) {
    //   const tmp: {[key: string]: any} = {
    //     'x': 2 * Math.random() - 1.0,
    //     'y': 2 * Math.random() - 1.0,
    //     'EventType': (this.colorAttributes[i] === 0) ? 'N' : 'A'
    //   };
    //   this.dataInstances.push(tmp);
    // };
    //
    // // this.rawDataKeyValue
    // // combined data - network events + event type
    // // adding event type (normal and abnormal) at the end of each instance
    // this.dataNetworkEvents = new Array();
    // for (let i = 0; i < this.rawDataKeyValue.length; i++) {
    //   const tmp = {...this.rawDataKeyValue[i]};
    //   tmp.EventType = (this.colorAttributes[i] === 0) ? 'N' : 'A';
    //   this.dataNetworkEvents.push(tmp);
    // };

    //
    // this.TSNEChart = new TsneChart('tsnechart-',
    //   this.uniqueChartIndexKey,
    //   dataNetworkEvents,
    //   dataInstances,
    //   'Raw: ' + this.txtDataRange,
    //   colormap,
    //   this);
    // this.TSNEChart.render();
    //
    // this.UMAPChart = new UmapChart('umapchart-',
    //   this.uniqueChartIndexKey,
    //   dataNetworkEvents,
    //   dataInstances,
    //   'Raw: ' + this.txtDataRange,
    //   colormap,
    //   this);
    // this.UMAPChart.render();
    //
    // this.PCAChart = new PCAChart('pcachart-',
    //   this.uniqueChartIndexKey,
    //   dataNetworkEvents,
    //   dataInstances,
    //   'Raw: ' + this.txtDataRange,
    //   colormap,
    //   this);
    // this.PCAChart.render();
    //
    // this.PCPChart = new PCPChart('pcpchart-',
    //   this.uniqueChartIndexKey,
    //   this.dmService.selectedVariables, // variables (dimensions)
    //   dataNetworkEvents,
    //   'Raw: ' + this.txtDataRange,
    //   colormap,
    //   this);
    // this.PCPChart.render();
  }

  isTSNEEnabled(){
    // if (this.TSNEChart === null || this.TSNEChart === undefined) {
    //   return true;
    // }
    // return this.TSNEChart.Enabled();
  }

  isUMAPEnabled(){
    // if (this.UMAPChart === null || this.UMAPChart === undefined) {
    //   return true;
    // }
    // return this.UMAPChart.Enabled();
  }

  isPCAEnabled(){
    // if (this.PCAChart === null || this.PCAChart === undefined) {
    //   return true;
    // }
    // return this.PCAChart.Enabled();
  }

  DestroyScatterplotCharts() {
    // complete remove from the ViewContainerRef if all charts are removed.
    // if (this.TSNEChart.Enabled() === false
    //   && this.UMAPChart.Enabled() === false
    //   && this.PCAChart.Enabled() === false){
    //   this.parentRef.removeChild(this.uniqueChartIndexKey);
    // }
  }

}

// https://embed.plnkr.co/Vj6JQb1BLooaSzZX/
// D3 tooltip - http://jsfiddle.net/FV4rL/2/
// https://www.oreilly.com/content/making-a-scatterplot-with-d3-js/
// https://www.c-sharpcorner.com/article/how-to-use-bootstrap-and-font-awesome-in-angular-apps/


// const getRandomColor = () => {
//   const letters = '0123456789ABCDEF';
//   let color = '#';
//   for (let i = 0; i < 6; i++) {
//     color += letters[Math.floor(Math.random() * 16)];
//   }
//   return color;
// };
// const tmpColor = getRandomColor();
