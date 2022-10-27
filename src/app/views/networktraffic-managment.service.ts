import {Injectable, OnDestroy} from '@angular/core';
import dygraphs_zoom from './dygraphs_zoom';
import {DygraphDataRange} from './dygraph-interfaces';
import {of} from 'rxjs';
import {DataManagementService} from "../database/data-management.service";

@Injectable({
  providedIn: 'root'
})

export class NetworktrafficManagmentService implements OnDestroy {
  private dygraphObjects: any[] = [];
  private dataRange: any[] = [];

  constructor(private dmService: DataManagementService) { }

  ngOnDestroy() {
  }

  /**
   * Add chart and synchronize them
   * @param chartObj passing chart object to be stored in dygraphObjects array.
   */
  public addChart(chartObj: any): void {
    this.dygraphObjects.push(chartObj);

    // synchronize two charts
    if (this.dygraphObjects.length >= 2) {
      const sync = dygraphs_zoom.synchronize(this.dygraphObjects);
    }
  }

  /**
   * Reset default settings for dygraph.
   */
  public reset(): void {
    this.dataRange = this.dygraphObjects[0].xAxisRange(); // current data range
    this.dygraphObjects.length = 0; // clear dygraph objects
  }

  /**
   * Update dataRange automatically whenever the user selects
   * in the selection bar.
   */
  public updateDataRange(): void {
    if (this.dataRange.length > 0) {
      this.dygraphObjects.forEach(
        (g) => {
          g.updateOptions({
            dateWindow: this.dataRange
          });
        }
      );
    }
  }

  /**
   * Reset dygraph zoom for all charts.
   */
  public resetZooming(): void {
    this.dygraphObjects.forEach(
      (g) => {
        g.clearSelection();
        g.resetZoom();
      }
    );
  }

  /**
   * Returns the currently-visible x-range.
   * Returns a two-element array: [left, right].
   */
  public getSelectedDataRange(): any {
    const g = this.dygraphObjects[0];
    const selectedDateRangeDygraph = g.xAxisRange(); // retrieve the visible data range along the x axis

    return new Array(new Date(selectedDateRangeDygraph[0]), new Date(selectedDateRangeDygraph[1]));
  }

  /**
   * Returns the original data based on the user selected data range.
   */
  public getSelectedOriginalData(chartNum: number): any {
    const g = this.dygraphObjects[chartNum]; // chartNum - 0 (normal) : 1 (abnormal)
    const selectedDateRangeDygraph = g.xAxisRange(); // retrieve the visible data range along the x axis
    const arrData: any[][] = [];  // data to be returned

    // const dataSelectedArray = [null, null];
    g.rawData_.forEach((arrayData, index) => {
      const dataDate = arrayData[0];  // get date information
      if (selectedDateRangeDygraph[0] <= dataDate && dataDate <= selectedDateRangeDygraph[1]) {
        // dataSelectedArray[1] = index; // save index information

        // const tmp = arrayData;
        const tmp  = Object.assign([], arrayData);
        tmp.shift(); // remove date information (located in the 1st column)
        if (tmp[0] !== null) { // skip data with null values
          arrData.push(tmp);
        }
      }
    });
    return arrData;
  }

  public getSelectedNetworkEventsRawData() {
    const arrKeyValueData: any = [];  // selected data (key & value) to be returned
    const arrValueData: any = [];  // selected data (values only) to be returned
    const arrMinMaxData: any = [];  // min & max data to be returned

    // create a default min & max data
    const dimensions = ['Date', ...this.dmService.selectedVariables];

    // set default min & max value
    dimensions.forEach((name) => {
      const minmax: { [key: string]: any } = {};
      minmax['min'] = Number.POSITIVE_INFINITY;
      minmax['max'] = Number.NEGATIVE_INFINITY;
      arrMinMaxData[name] = minmax;
    });

      // Fetch normal data
    this.dygraphObjects[0].rawData_.forEach((arrayData, index) => {
      const dataDate = arrayData[0];  // get date information
      const selectedDateRangeDygraph = this.dygraphObjects[0].xAxisRange(); // retrieve the visible data range along the x axis
      if (selectedDateRangeDygraph[0] <= dataDate && dataDate <= selectedDateRangeDygraph[1]) {

        const data  = Object.assign([], arrayData);
        if (data[1] !== null) { // skip data with null values
          const convertedKeyValueData: { [key: string]: any } = {};
          const convertedValueData: any = [];

          // add date information
          convertedKeyValueData['Date'] = new Date(data[0]);

          let dataindex = 0;
          dimensions.forEach((name, index) => {
            // value
            const tmpData = data[index];
            convertedKeyValueData[name] = tmpData;
            convertedValueData[dataindex++] = tmpData;

            // update min & max value
            arrMinMaxData[name].max = (arrMinMaxData[name].max < tmpData) ? tmpData : arrMinMaxData[name].max;
            arrMinMaxData[name].min = (arrMinMaxData[name].min > tmpData) ? tmpData : arrMinMaxData[name].min;
          });
          convertedKeyValueData['EventType'] = 'N'; // Normal Data
          arrKeyValueData.push(convertedKeyValueData);
          arrValueData.push(convertedValueData);
        }
      }
    });

    // Fetch abnormal data
    this.dygraphObjects[1].rawData_.forEach((arrayData, index) => {
      const dataDate = arrayData[0];  // get date information
      const selectedDateRangeDygraph = this.dygraphObjects[1].xAxisRange(); // retrieve the visible data range along the x axis
      if (selectedDateRangeDygraph[0] <= dataDate && dataDate <= selectedDateRangeDygraph[1]) {

        const data  = Object.assign([], arrayData);
        if (data[1] !== null) { // skip data with null values
          const convertedKeyValueData: { [key: string]: any } = {};
          const convertedValueData: any = [];

          // add date information
          convertedKeyValueData['Date'] = new Date(data[0]);

          let dataindex = 0;
          dimensions.forEach((name, index) => {
            const tmpData = data[index];
            convertedKeyValueData[name] = tmpData;
            convertedValueData[dataindex++] = tmpData;

            // update min & max value
            arrMinMaxData[name].max = (arrMinMaxData[name].max < tmpData) ? tmpData : arrMinMaxData[name].max;
            arrMinMaxData[name].min = (arrMinMaxData[name].min > tmpData) ? tmpData : arrMinMaxData[name].min;
          });
          convertedKeyValueData['EventType'] = 'A'; // Abnormal Data
          arrKeyValueData.push(convertedKeyValueData);
          arrValueData.push(convertedValueData);
        }
      }
    });
    return [arrKeyValueData, arrValueData, arrMinMaxData];
  }

}
