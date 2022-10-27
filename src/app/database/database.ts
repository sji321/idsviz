// import ndarray from "ndarray";
import { Dimension, View1D, View2D, Views } from "./interfaces";
import { Interval } from "./basic";

export const HIST_TYPE = Int32Array;
export const CUM_ARR_TYPE = Float32Array; // use float because we arer storing sums

export interface Hist {
  hist: any;
  noBrush: any;
}

export type SyncIndex<V> = Map<V, Hist>;
export type AsyncIndex<V> = Map<V, Promise<Hist>>;
export type Index<V> = SyncIndex<V> | AsyncIndex<V>;

// export interface DataBase<V extends string, D extends string> {
//   initialize(): Promise<void> | void;
//
//   /* Are database requests blocking or asynchronous. */
//   readonly blocking: boolean;
//
//   length(): Promise<number> | number;
//   histogram(
//     dimension: Dimension<D>,
//     brushes?: Map<D, Interval<number>>
//   ): Promise<Hist> | Hist;
//   heatmap(dimensions: [Dimension<D>, Dimension<D>]): Promise<any> | any;
//
//   loadData1D(
//     activeView: View1D<D>,
//     pixels: number,
//     views: Views<V, D>,
//     brushes: Map<D, Interval<number>>
//   ): Index<V>;
//
//   loadData2D(
//     activeView: View2D<D>,
//     pixels: [number, number],
//     views: Views<V, D>,
//     brushes: Map<D, Interval<number>>
//   ): Index<V>;
//
//   getDimensionExtent(
//     dimension: Dimension<D>
//   ): Promise<Interval<number>> | Interval<number>;
// }
