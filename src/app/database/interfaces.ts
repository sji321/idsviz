/*
 * A single dimension of a view.
 */
import {Interval} from "./basic";

export interface Dimension<D> {
  /* The name of the dimension. */
  name: D;

  /* A title for the dimension */
  title?: string;

  /* Initial domain for the dimension.  If it's not supplied, will be inferred from the extent of the data. */
  extent?: Interval<number>;

  /* D3 format specifier. If time is true, this has to be a D3 date format. Otherwise it should be a number format. */
  format: string;
  time?: boolean;

  /* Number of bins for this dimension. We will use this as the resolution at all zoom levels. */
  bins: number;

  /* Current configuration of bins. */
  binConfig?: BinConfig;
}

/*
 * Binning configuration.
 */
export interface BinConfig {
  start: number;
  stop?: number;
  step: number;
}


/*
 * Views
 */
export interface AbstractView {
  /* The number of dimensions in the view. */
  type: "0D" | "1D" | "2D";

  /* Title for axis. Should not be used as an identifier. */
  title?: string;

  /* The html element to attach the view to. If null, the view will be ignored. */
  el?: HTMLElement | null;
}

export interface View0D extends AbstractView {
  type: "0D";
}

export interface View1D<D extends string> extends AbstractView {
  type: "1D";

  /* The dimension for this view. */
  dimension: Dimension<D>;
}

export interface View2D<D extends string> extends AbstractView {
  type: "2D";
  chartSize?: [number, number];

  /* The dimensions for this view. */
  dimensions: [Dimension<D>, Dimension<D>];
}




/*
 * Map from view name to view. The name can be used as an identifier.
 */
export type Views<V extends string, D extends string> = Map<V, View<D>>;
export type View<D extends string> = View0D | View1D<D> | View2D<D>;

export interface DataField {
  name: string;
  stat: any;
  disabled: boolean;
  selected: boolean;
}

export interface DataFieldMinMax {
  variableName: string;
  min: number;
  max: number;
}

export interface DygraphData {
  data: any[];
  names: string[];
}

export interface SL {
  belief: number;  // belief
  disbelief: number;  // disbelief
  uncertainty: number;  // uncertainty
  baserate: number;  // base rate
  projected_probability: number;
}

export class SLHeatmap implements SL {
  belief: number;  // belief
  disbelief: number;  // disbelief
  uncertainty: number;  // uncertainty
  baserate: number;  // base rate
  time: number; // time: hour / min
  normal: number; // normal
  abnormal: number; // abnormal
  projected_probability: number;
  constructor(obj?: SLHeatmap) {
    if (obj == undefined) {
      this.belief = 0;
      this.disbelief = 0;
      this.uncertainty = 0;
      this.baserate = 0;
      this.time = 0;
      this.normal = 0;
      this.abnormal = 0;
      this.projected_probability = 0;
    } else {
      this.belief = obj.belief;
      this.disbelief = obj.disbelief;
      this.uncertainty = obj.uncertainty;
      this.baserate = obj.baserate;
      this.time = obj.time;
      this.normal = obj.normal;
      this.abnormal = obj.abnormal;
      this.projected_probability = 0;
    }
  }
  // // Cumulative Fusion Operator
  // [Symbol.for('+')](other) {
  //   let denominator = this.uncertainty + other.uncertainty - this.uncertainty * other.uncertainty;
  //   const b = (this.b * other.uncertainty + other.b * this.uncertainty) / denominator;
  //   const uncertainty = (this.uncertainty * other.uncertainty) / denominator;
  //   const baserate = (this.baserate * other.uncertainty + other.baserate * this.uncertainty - (this.baserate + other.baserate) * this.uncertainty * other.uncertainty)
  //     / (this.uncertainty + other.uncertainty - 2 * this.uncertainty * other.uncertainty); // assumption u_a <> 1 V u_b <> 1
  //   const disbelief = 1 - (b + uncertainty);
  //   const time = this.time;
  //   const normal = this.normal;
  //   const abnormal = this.abnormal;
  //   return new SLHeatmap(b, disbelief, uncertainty, baserate, time, normal, abnormal);
  // }

}



export function getHoursDiff(startDate: any, endDate: any) {
  const msInHour = 1000 * 60 * 60;
  return Math.round(Math.abs(endDate - startDate) / msInHour);
}

// function product_Range(a: number, b: number) {
//   let prd = a,i = a;
//   while (i++< b) {
//     prd *= i;
//   }
//   return prd;
// }
//
// export function combinations(n: number, r: number)
// {
//   if (n==r || r==0)
//   {
//     return 1;
//   }
//   else
//   {
//     r=(r < n-r) ? n-r : r;
//     return product_Range(r+1, n)/product_Range(1,n-r);
//   }
// }



// export function columnStats(arrowTable, columnName) {
//   const column = arrowTable.get(0);
//   console.log(column.toArray());
//   let max = column.get(0);
//   let min = max;
//   for (let value of column) {
//     if (value > max) {
//       max = value;
//     }
//     else if (value < min) {
//       min = value;
//     }
//   }
//   return {min, max, range: max-min};
// }
