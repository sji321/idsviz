/**
 *
 * References:
 * Apache-arrow - https://github.com/apache/arrow/tree/master/js
 */
import { Table, tableFromIPC } from 'apache-arrow';
import {Dimension, View1D, View2D, Views, BinConfig, DataField} from './interfaces';
import { Interval } from './basic';
import { BitSet, union } from './bitset';


// import ndarray from 'ndarray';
// import prefixSum from "ndarray-prefix-sum";
// import { binNumberFunction, binNumberFunctionBins, numBins } from "../util";
import { SyncIndex, HIST_TYPE, CUM_ARR_TYPE } from './database';

// https://arrow.apache.org/docs/js/
// https://observablehq.com/@randomfractals/apache-arrow

/*
 * Returns a function that returns the bin for a value.
 */
// tslint:disable-next-line:typedef
export function binNumberFunction({ start, step }: BinConfig) {
  return (v: number) => Math.floor((v - start) / step);
}

export class ArrowTable {
  private summaryNormalEventsData: Table;  // apache-arrow data
  private summaryAbnormalEventsData: Table;  // apache-arrow data
  private originalData: string = ''; // original data name

  // public readonly blocking: boolean = true;

  public constructor(private readonly summaryNormalEventsDataBuffer: string,
                     private readonly summaryAbnormalEventsDataBuffer: string) {}

  private filterMaskIndex = new Map<string, BitSet>();

  public async loadSummaryData(): Promise<DataField[]> {
    const summaryDataFields: DataField[] = [];

    if (!this.summaryNormalEventsDataBuffer || !this.summaryAbnormalEventsDataBuffer) {
      return summaryDataFields; // no summaryNormalEventsDataBuffer is defined
    }

    let response: any;
    let buffer: ArrayBuffer;
    console.time('BEGIN: Load Normal Event Data');
    this.summaryNormalEventsData = await tableFromIPC(fetch(this.summaryNormalEventsDataBuffer));
    console.timeEnd('END: Load Normal Event Data');

    console.time('BEGIN: Load Abnormal Event Data');
    this.summaryAbnormalEventsData = await tableFromIPC(fetch(this.summaryAbnormalEventsDataBuffer));
    console.timeEnd('END: Load Abnormal Event Data');

    // fetch all exists data fields from the data
    this.summaryNormalEventsData.schema.fields.map(
      (d) => {
        summaryDataFields.push({name: d.name, stat: null, disabled: false, selected: false});
      } );

    // determine min & max per each variable
    for (let i=0; i<this.summaryNormalEventsData.numRows; i++) {
      const row = this.summaryNormalEventsData.get(i);
      if (row === null) continue;
      const dataArray = row.toArray();
      for (let col=0; col<dataArray.length; col++) {
        const value = dataArray[col];
        let max, min;
        if (summaryDataFields[col].stat == undefined) {
          max = min = value;
          summaryDataFields[col].stat = {min, max, range: max-min};
        } else {
          max = summaryDataFields[col].stat.max;
          min = summaryDataFields[col].stat.min;
          if (value > max) {
            max = value;
          }
          else if (value < min) {
            min = value;
          }
          summaryDataFields[col].stat = {min, max, range: max-min};
        }
      }
    }

    // determine if the values in each variable is valid or not.
    summaryDataFields.forEach(item => {
      if (item.stat.min == item.stat.max)
        item.disabled = true;
      else if (item.stat.min <= 0.1 && item.stat.max <= 0.1)
        item.disabled = true;
      else if (item.stat.range <= 0.1)
        item.disabled = true;
      else if (item.stat.range == 'Infinity')
        item.disabled = true;
    });

    // const column = arrowTable.get(0);
    // console.log(column.toArray());
    // let max = column.get(0);
    // let min = max;
    // for (let value of column) {
    //   if (value > max) {
    //     max = value;
    //   }
    //   else if (value < min) {
    //     min = value;
    //   }
    // }
    // return {min, max, range: max-min};

    // summaryDataFields.forEach(item => {
    //   console.log(item.variableName);
    //   const x = columnStats(this.summaryNormalEventsData, item.variableName);
    //
    //   const column = this.summaryNormalEventsData.select([item.variableName]);
    //
    //
    // });

    // console.table([...this.summaryAbnormalEventsData]);

    // const tmp = this.summaryNormalEventsData.select(['Timestamp', 'Flow Duration', 'Total Fwd Packets', 'Total Backward Packets']);
    // // console.table([...tmp]);
    // for (let i = 0; i < tmp.numRows; i++) {
    //   const current = tmp.get(i);
    //   if (current !== null) {
    //     console.table(current.toArray());
    //   }
    // }
    //
    // const current = tmp.get(0);
    // if (current !== null) {
    //   console.table(current.toArray());
    //   // current['forEach'](
    //   //   (value, index) => {
    //   //     console.log(value);
    //   //   });
    // }
    //
    // const data = tmp.toArray();
    // data.forEach( (value, index) => {
    //
    // });
    // const x1 = tmp.getChildAt(0); // 4908
    // const x2 = tmp.getChildAt(1); // 2454
    // console.log(tmp);
    // if (x1 !== null) {
    //   const x2 = x1.data;
    //   console.log(x2);
    // }
    //
    // for (let i = -1, n = tmp.numCols; ++i < n;) {
    //   const current = tmp.get(i);
    //
    // }
    return summaryDataFields;

    // const fieldTypes = this.summaryNormalEventsData.schema.fields.map(f => f.type);
    // console.log(this.fields.toString());
    // console.log(fieldTypes.toString());
    // predicate.custom()
    // this.data.getColumn()

  }


  public selectSummaryData(columnNames: string[]): any {
    return ([this.summaryNormalEventsData.select(columnNames), this.summaryAbnormalEventsData.select(columnNames)]);
  }

  // public getSummaryDataLength(): number {
  //   if (this.summaryNormalEventsData) {
  //     return this.summaryNormalEventsData.length;
  //   }
  //   return 0;
  // }

  // public getSummaryDataColData(field: string): any {
  //   return (this.summaryNormalEventsData.getColumn(field));
  // }

  // public updateChartData() {
  //   // const coldata = this.data.select(this.fields[0], this.fields[1]);
  //   const coldata = this.originalData.select('Timestamp', 'Flow Duration');
  //
  //   const plotData = [];
  //   for (let i = -1, n = coldata.length; ++i < n;) {
  //     const element = coldata.get(i);
  //     plotData.push([new Date(element[0]), element[1]]);
  //   }
  //
  //   this.selectedData = plotData;
  //
  //   // // if (this.chartdata.length === 0) {
  //   //   // const date = this.originalData.getColumn(this.fields[0]).toArray();
  //   //   // const originalData = this.originalData.getColumn(this.fields[1]).toArray();
  //   //   // this.chartdata = [...date, ...data];
  //   //   const tmp = this.data.select(this.fields[0], this.fields[1]).toArray();
  //   //
  //   //   this.chartdata = tmp;
  //   //   // for (let i = 0; i < this.data.length; i++) {
  //   //   //   //chartdata.
  //   //   // }
  //   // }
  //   // return this.chartdata;
  //   // return [this.data.get(0)].concat(this.data.get(1));
  //   // return (this.data.get(1));  // default
  // }

  // private getFilterMask(dimension: D, extent: Interval<number>) {
  //   const key = `${dimension} ${extent}`;
  //
  //   const m = this.filterMaskIndex.get(key);
  //   if (m) {
  //     return m;
  //   }
  //
  //   // tslint:disable-next-line:no-non-null-assertion
  //   const column = this.originalData.getColumn(dimension)!;
  //   const mask = new BitSet(column.length);
  //
  //   for (let i = 0; i < column.length; i++) {
  //     // tslint:disable-next-line:no-non-null-assertion
  //     const val: number = column.get(i)!;
  //     if (val < extent[0] || val >= extent[1]) {
  //       mask.set(i, true);
  //     }
  //   }
  //
  //   this.filterMaskIndex.set(key, mask);
  //
  //   return mask;
  // }
  //
  //
  // public histogram(
  //   dimension: Dimension<D>,
  //   brushes?: Map<D, Interval<number>>
  // ) {
  //
  //   console.time('Histogram');
  //
  //   // const filterMask = union(
  //   //   ...this.getFilterMasks(brushes || new Map()).values()
  //   // );
  //   //
  //   // const binConfig = dimension.binConfig!;
  //   // const bin = binNumberFunction(binConfig); // Math.floor((v - start) / step)
  //   // const binCount = numBins(binConfig);
  //   //
  //   // // fetch column data
  //   // const column = this.data.getColumn(dimension.name)!;
  //   //
  //   // const noBrush = ndarray(new HIST_TYPE(binCount));
  //   // const hist = filterMask ? ndarray(new HIST_TYPE(binCount)) : noBrush;
  //   // for (let i = 0; i < this.data.length; i++) {
  //   //   const value: number = column.get(i)!;
  //   //   const key = bin(value);
  //   //   if (0 <= key && key < binCount) {
  //   //     const idx = hist.index(key);
  //   //     noBrush.data[idx]++;
  //   //     if (filterMask && !filterMask.get(i)) {
  //   //       hist.data[idx]++;
  //   //     }
  //   //   }
  //   // }
  //   //
  //   // console.timeEnd("Histogram");
  //   //
  //   // return {
  //   //   hist,
  //   //   noBrush
  //   // };
  // }
  //
  // public heatmap(dimensions: [Dimension<D>, Dimension<D>]) {
  //
  //   console.time('Heatmap');
  //
  //   // const binConfigs = dimensions.map(d => d.binConfig!);
  //   // const [numBinsX, numBinsY] = binConfigs.map(numBins);
  //   // const [binX, binY] = binConfigs.map(binNumberFunction);
  //   // const [columnX, columnY] = dimensions.map(
  //   //   d => this.data.getColumn(d.name)!
  //   // );
  //   //
  //   // const heat = ndarray(new HIST_TYPE(numBinsX * numBinsY), [
  //   //   numBinsX,
  //   //   numBinsY
  //   // ]);
  //   //
  //   // for (let i = 0; i < this.data.length; i++) {
  //   //   const keyX = binX(columnX.get(i)!);
  //   //   const keyY = binY(columnY.get(i)!);
  //   //
  //   //   if (0 <= keyX && keyX < numBinsX && 0 <= keyY && keyY < numBinsY) {
  //   //     heat.data[heat.index(keyX, keyY)]++;
  //   //   }
  //   // }
  //   //
  //   // console.timeEnd("Heatmap");
  //   //
  //   // return heat;
  // }
  //
  // private getFilterMasks(brushes: Map<D, Interval<number>>): Map<D, BitSet> {
  //   if (!brushes.size) {
  //     // no brushes => no filters
  //     return new Map();
  //   }
  //
  //
  //   console.time('Build filter masks');
  //
  //   const filters = new Map<D, BitSet>();
  //   for (const [dimension, extent] of brushes) {
  //     filters.set(dimension, this.getFilterMask(dimension, extent));
  //   }
  //
  //
  //   console.timeEnd('Build filter masks');
  //
  //   return filters;
  // }
  //
  // public loadData1D(
  //   activeView: View1D<D>,
  //   pixels: number,
  //   views: Views<V, D>,
  //   brushes: Map<D, Interval<number>>
  // ) {
  //
  //   console.time('Build index');
  //
  //   // const filterMasks = this.getFilterMasks(brushes);
  //   // const cubes: SyncIndex<V> = new Map();
  //   //
  //   // const activeDim = activeView.dimension;
  //   // const binActive = binNumberFunctionBins(activeDim.binConfig!, pixels);
  //   // const activeCol = this.data.getColumn(activeDim.name)!;
  //   // const numPixels = pixels + 1; // extending by one pixel so we can compute the right diff later
  //   //
  //   // for (const [name, view] of views) {
  //   //   // array for histograms with last histogram being the complete histogram
  //   //   let hists: ndarray;
  //   //   let noBrush: ndarray;
  //   //
  //   //   // get union of all filter masks that don't contain the dimension(s) for the current view
  //   //   const relevantMasks = new Map(filterMasks);
  //   //   if (view.type === "0D") {
  //   //     // use all filters
  //   //   } else if (view.type === "1D") {
  //   //     relevantMasks.delete(view.dimension.name);
  //   //   } else {
  //   //     relevantMasks.delete(view.dimensions[0].name);
  //   //     relevantMasks.delete(view.dimensions[1].name);
  //   //   }
  //   //   const filterMask = union(...relevantMasks.values());
  //   //
  //   //   if (view.type === "0D") {
  //   //     hists = ndarray(new CUM_ARR_TYPE(numPixels));
  //   //     noBrush = ndarray(new HIST_TYPE(1), [1]);
  //   //
  //   //     // add data to aggregation matrix
  //   //     for (let i = 0; i < this.data.length; i++) {
  //   //       // ignore filtered entries
  //   //       if (filterMask && filterMask.get(i)) {
  //   //         continue;
  //   //       }
  //   //
  //   //       const keyActive = binActive(activeCol.get(i)!) + 1;
  //   //       if (0 <= keyActive && keyActive < numPixels) {
  //   //         hists.data[hists.index(keyActive)]++;
  //   //       }
  //   //       noBrush.data[0]++;
  //   //     }
  //   //
  //   //     prefixSum(hists);
  //   //   } else if (view.type === "1D") {
  //   //     const dim = view.dimension;
  //   //
  //   //     const binConfig = dim.binConfig!;
  //   //     const bin = binNumberFunction(binConfig);
  //   //     const binCount = numBins(binConfig);
  //   //
  //   //     hists = ndarray(new CUM_ARR_TYPE(numPixels * binCount), [
  //   //       numPixels,
  //   //       binCount
  //   //     ]);
  //   //     noBrush = ndarray(new HIST_TYPE(binCount), [binCount]);
  //   //
  //   //     const column = this.data.getColumn(dim.name)!;
  //   //
  //   //     // add data to aggregation matrix
  //   //     for (let i = 0; i < this.data.length; i++) {
  //   //       // ignore filtered entries
  //   //       if (filterMask && filterMask.get(i)) {
  //   //         continue;
  //   //       }
  //   //
  //   //       const key = bin(column.get(i)!);
  //   //       const keyActive = binActive(activeCol.get(i)!) + 1;
  //   //       if (0 <= key && key < binCount) {
  //   //         if (0 <= keyActive && keyActive < numPixels) {
  //   //           hists.data[hists.index(keyActive, key)]++;
  //   //         }
  //   //         noBrush.data[key]++;
  //   //       }
  //   //     }
  //   //
  //   //     // compute cumulative sums
  //   //     for (let x = 0; x < hists.shape[1]; x++) {
  //   //       prefixSum(hists.pick(null, x));
  //   //     }
  //   //   } else {
  //   //     const dimensions = view.dimensions;
  //   //     const binConfigs = dimensions.map(d => d.binConfig!);
  //   //     const [numBinsX, numBinsY] = binConfigs.map(numBins);
  //   //     const [binX, binY] = binConfigs.map(c => binNumberFunction(c));
  //   //     const [columnX, columnY] = dimensions.map(
  //   //       d => this.data.getColumn(d.name)!
  //   //     );
  //   //
  //   //     hists = ndarray(new CUM_ARR_TYPE(numPixels * numBinsX * numBinsY), [
  //   //       numPixels,
  //   //       numBinsX,
  //   //       numBinsY
  //   //     ]);
  //   //     noBrush = ndarray(new HIST_TYPE(numBinsX * numBinsY), [
  //   //       numBinsX,
  //   //       numBinsY
  //   //     ]);
  //   //
  //   //     for (let i = 0; i < this.data.length; i++) {
  //   //       // ignore filtered entries
  //   //       if (filterMask && filterMask.get(i)) {
  //   //         continue;
  //   //       }
  //   //
  //   //       const keyX = binX(columnX.get(i)!);
  //   //       const keyY = binY(columnY.get(i)!);
  //   //       const keyActive = binActive(activeCol.get(i)!) + 1;
  //   //       if (0 <= keyX && keyX < numBinsX && 0 <= keyY && keyY < numBinsY) {
  //   //         if (0 <= keyActive && keyActive < numPixels) {
  //   //           hists.data[hists.index(keyActive, keyX, keyY)]++;
  //   //         }
  //   //         noBrush.data[noBrush.index(keyX, keyY)]++;
  //   //       }
  //   //     }
  //   //
  //   //     // compute cumulative sums
  //   //     for (let x = 0; x < hists.shape[1]; x++) {
  //   //       for (let y = 0; y < hists.shape[2]; y++) {
  //   //         prefixSum(hists.pick(null, x, y));
  //   //       }
  //   //     }
  //   //   }
  //   //
  //   //   cubes.set(name, { hists, noBrush: noBrush });
  //   // }
  //   //
  //   // console.timeEnd("Build index");
  //   //
  //   // return cubes;
  // }
  //
  // public loadData2D(
  //   activeView: View2D<D>,
  //   pixels: [number, number],
  //   views: Views<V, D>,
  //   brushes: Map<D, Interval<number>>
  // ) {
  //   console.time('Build index');
  //
  //   // const filterMasks = this.getFilterMasks(brushes);
  //   // const cubes: SyncIndex<V> = new Map();
  //   //
  //   // const [activeDimX, activeDimY] = activeView.dimensions;
  //   // const binActiveX = binNumberFunctionBins(activeDimX.binConfig!, pixels[0]);
  //   // const binActiveY = binNumberFunctionBins(activeDimY.binConfig!, pixels[1]);
  //   // const activeColX = this.data.getColumn(activeDimX.name)!;
  //   // const activeColY = this.data.getColumn(activeDimY.name)!;
  //   //
  //   // const [numPixelsX, numPixelsY] = [pixels[0] + 1, pixels[1] + 1];
  //   //
  //   // for (const [name, view] of views) {
  //   //   // array for histograms with last histogram being the complete histogram
  //   //   let hists: ndarray;
  //   //   let noBrush: ndarray;
  //   //
  //   //   // get union of all filter masks that don't contain the dimension(s) for the current view
  //   //   const relevantMasks = new Map(filterMasks);
  //   //   if (view.type === "0D") {
  //   //     // use all filters
  //   //   } else if (view.type === "1D") {
  //   //     relevantMasks.delete(view.dimension.name);
  //   //   } else {
  //   //     relevantMasks.delete(view.dimensions[0].name);
  //   //     relevantMasks.delete(view.dimensions[1].name);
  //   //   }
  //   //   const filterMask = union(...relevantMasks.values());
  //   //
  //   //   if (view.type === "0D") {
  //   //     hists = ndarray(new CUM_ARR_TYPE(numPixelsX * numPixelsY), [
  //   //       numPixelsX,
  //   //       numPixelsY
  //   //     ]);
  //   //     noBrush = ndarray(new HIST_TYPE(1));
  //   //
  //   //     // add data to aggregation matrix
  //   //     for (let i = 0; i < this.data.length; i++) {
  //   //       // ignore filtered entries
  //   //       if (filterMask && filterMask.get(i)) {
  //   //         continue;
  //   //       }
  //   //
  //   //       const keyActiveX = binActiveX(activeColX.get(i)!) + 1;
  //   //       const keyActiveY = binActiveY(activeColY.get(i)!) + 1;
  //   //       if (
  //   //         0 <= keyActiveX &&
  //   //         keyActiveX < numPixelsX &&
  //   //         0 <= keyActiveY &&
  //   //         keyActiveY < numPixelsY
  //   //       ) {
  //   //         hists.data[hists.index(keyActiveX, keyActiveY)]++;
  //   //       }
  //   //
  //   //       // add to cumulative hist
  //   //       noBrush.data[0]++;
  //   //     }
  //   //
  //   //     prefixSum(hists);
  //   //   } else if (view.type === "1D") {
  //   //     const dim = view.dimension;
  //   //
  //   //     const binConfig = dim.binConfig!;
  //   //     const bin = binNumberFunction(binConfig);
  //   //     const binCount = numBins(binConfig);
  //   //
  //   //     hists = ndarray(new CUM_ARR_TYPE(numPixelsX * numPixelsY * binCount), [
  //   //       numPixelsX,
  //   //       numPixelsY,
  //   //       binCount
  //   //     ]);
  //   //     noBrush = ndarray(new HIST_TYPE(binCount));
  //   //
  //   //     const column = this.data.getColumn(dim.name)!;
  //   //
  //   //     // add data to aggregation matrix
  //   //     for (let i = 0; i < this.data.length; i++) {
  //   //       // ignore filtered entries
  //   //       if (filterMask && filterMask.get(i)) {
  //   //         continue;
  //   //       }
  //   //
  //   //       const key = bin(column.get(i)!);
  //   //       const keyActiveX = binActiveX(activeColX.get(i)!) + 1;
  //   //       const keyActiveY = binActiveY(activeColY.get(i)!) + 1;
  //   //       if (0 <= key && key < binCount) {
  //   //         if (
  //   //           0 <= keyActiveX &&
  //   //           keyActiveX < numPixelsX &&
  //   //           0 <= keyActiveY &&
  //   //           keyActiveY < numPixelsY
  //   //         ) {
  //   //           hists.data[hists.index(keyActiveX, keyActiveY, key)]++;
  //   //         }
  //   //
  //   //         // add to cumulative hist
  //   //         noBrush.data[key]++;
  //   //       }
  //   //     }
  //   //
  //   //     // compute cumulative sums
  //   //     for (let x = 0; x < hists.shape[2]; x++) {
  //   //       prefixSum(hists.pick(null, null, x));
  //   //     }
  //   //   } else {
  //   //     throw new Error("2D view brushing and viewing not yet implemented.");
  //   //   }
  //   //
  //   //   cubes.set(name, { hists, noBrush: noBrush });
  //   // }
  //   //
  //   // console.timeEnd("Build index");
  //   //
  //   // return cubes;
  // }
  //
  // public getDimensionExtent(dimension: Dimension<D>): Interval<number> {
  //   // tslint:disable-next-line:no-non-null-assertion
  //   const column = this.originalData.getColumn(dimension.name)!;
  //   let max: number = column.get(0)!;
  //   let min = max;
  //
  //   for (const value of column) {
  //     if (value! > max) {
  //       max = value!;
  //     } else if (value! < min) {
  //       min = value!;
  //     }
  //   }
  //
  //   return [min, max];
  // }
}
