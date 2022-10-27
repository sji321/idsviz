
/**
 * run Subjective Logic with Binomial Beta Distribution
 * @param dataFields
 * @param normalEventData
 * @param abnormalEventData
 */
import {SLHeatmap} from "../database/interfaces";

export function runSLBBDistribution(normalEventData:any, abnormalEventData:any,
  SL24hours:any, SL60mins, W:any, baseRate:any): void {

    // initialize heatmap
  if (SL24hours.length > 0)
    SL24hours.splice(0); // remove all elements if exist
  if (SL60mins.length > 0)
    SL60mins.splice(0);

  for (let hr = 0; hr < 24; hr++){
    const item = new SLHeatmap();
    item.time = hr;
    SL24hours.push(item);
  }

  // Minutely Heatmap
  for (let min = 0; min < 60; min++){
    const item = new SLHeatmap();
    item.time = min;
    SL60mins.push(item);
  }

  // fetching normal event data
  for (let i = 0; i < normalEventData.numRows; i++) {
    const data = normalEventData.get(i);
    if (data === null) continue;
    const dataArray = data.toArray();
    dataArray[0] += 14400000; // convert it to US/Eastern time
    const date = new Date(+dataArray[0]); // convert UNIX timestamp to time in JavaScript
    const hour = date.getHours();
    SL24hours[hour].normal++;
    const minute = date.getMinutes();
    SL60mins[minute].normal++;
  }

  // fetching abnormal event data
  for (let i = 0; i < abnormalEventData.numRows; i++) {
    const data = abnormalEventData.get(i);
    if (data === null) continue;
    const dataArray = data.toArray();
    dataArray[0] += 14400000; // convert it to US/Eastern time
    const date = new Date(+dataArray[0]); // convert UNIX timestamp to time in JavaScript
    const hour = date.getHours();
    SL24hours[hour].abnormal++;
    const minute = date.getMinutes();
    SL60mins[minute].abnormal++;
  }

  // // determine # of normal / abnormal events in each hour
  // for (let i = 0; i < fetchedAllEventDate.length; i++) {
  //   const date = new Date(+fetchedAllEventDate[i]); // convert UNIX timestamp to time in JavaScript
  //   const hour = date.getHours();
  //
  //   // determine # of events in each hour
  //   const eventType = fetchedAllEventTarget[i];  // 0: normal | 1: abnormal
  //   if (eventType == 0) {
  //     SL24hours[hour].normal++;
  //   }
  //   else {
  //     SL24hours[hour].abnormal++;
  //   }
  // }

  // # of abnormal (r_x)
  // # of normal (a_x)
  let a_x = baseRate;
  let alpha, beta;
  for (let hr = 0; hr < 24; hr++) {
    const r_x = SL24hours[hr].abnormal;
    const s_x = SL24hours[hr].normal;

    alpha = r_x + a_x * W;
    beta = s_x + (1 - a_x) * W;
    SL24hours[hr].belief = r_x / (r_x + s_x + W);
    SL24hours[hr].disbelief = s_x / (r_x + s_x + W);
    SL24hours[hr].uncertainty = W / (r_x + s_x + W);

    // P(x) = b_x + a_x * u_x
    SL24hours[hr].projected_probability = SL24hours[hr].belief + a_x * SL24hours[hr].uncertainty;

    a_x = alpha / (alpha + beta); // update a_x (base rate) for next computation

    // console.log(SL24hours[hr].projected_probability, SL24hours[hr].belief);
  }

  // // determine # of normal / abnormal events in each hour
  // for (let i = 0; i < fetchedAllEventDate.length; i++) {
  //   const date = new Date(+fetchedAllEventDate[i]); // convert UNIX timestamp to time in JavaScript
  //   const minute = date.getMinutes();
  //   const eventType = fetchedAllEventTarget[i];  // 0: normal | 1: abnormal
  //
  //   if (eventType == 0)
  //     SL60mins[minute].normal++;
  //   else
  //     SL60mins[minute].abnormal++;
  // }

  a_x = baseRate;
  for (let min = 0; min < 60; min++){
    const r_x = SL60mins[min].abnormal;
    const s_x = SL60mins[min].normal;

    alpha = r_x + a_x * W;
    beta = s_x + (1 - a_x) * W;
    SL60mins[min].belief = r_x / (r_x + s_x + W);
    SL60mins[min].disbelief = s_x / (r_x + s_x + W);
    SL60mins[min].uncertainty = W / (r_x + s_x + W);
    SL60mins[min].projected_probability = SL60mins[min].belief + a_x * SL60mins[min].uncertainty;

    a_x = alpha / (alpha + beta); // update a_x (base rate)
  }
}

export function runRangeSLBBDistribution(normalEventData:any, abnormalEventData:any,
                                    datePeriod:any, SL24hours:any, SL60mins, W:any, baseRate:any): void {

  let dateBegin: any;
  let dateEnd: any;

  if (datePeriod != null) {
    dateBegin = new Date(+datePeriod[0]);
    dateEnd = new Date(+datePeriod[1]);
  }

  // initialize heatmap
  for (let hr = 0; hr < 24; hr++){
    SL24hours[hr].normal = 0;
    SL24hours[hr].abnormal = 0;
  }

  // Minutely Heatmap
  for (let min = 0; min < 60; min++){
    SL60mins[min].normal = 0;
    SL60mins[min].abnormal = 0;
  }

  // fetching normal event data
  for (let i = 0; i < normalEventData.data.length; i++) {
    const date = new Date(+normalEventData.data[i][0]); // convert UNIX timestamp to time in JavaScript

    if (datePeriod != null) {
      if (dateBegin <= date && date <= dateEnd) {
        const hour = date.getHours();
        SL24hours[hour].normal++;
        const minute = date.getMinutes();
        SL60mins[minute].normal++;
      }
    } else {
      // no date period is selected
      const hour = date.getHours();
      SL24hours[hour].normal++;
      const minute = date.getMinutes();
      SL60mins[minute].normal++;
    }
  }

  // fetching abnormal event data
  for (let i = 0; i < abnormalEventData.data.length; i++) {
    const date = new Date(+abnormalEventData.data[i][0]); // convert UNIX timestamp to time in JavaScript

    if (datePeriod != null) {
      if (dateBegin <= date && date <= dateEnd) {
        const hour = date.getHours();
        SL24hours[hour].abnormal++;
        const minute = date.getMinutes();
        SL60mins[minute].abnormal++;
      }
    } else {
      // no date period is selected
      const hour = date.getHours();
      SL24hours[hour].abnormal++;
      const minute = date.getMinutes();
      SL60mins[minute].abnormal++;
    }
  }

  // # of abnormal (r_x)
  // # of normal (a_x)
  let a_x = baseRate;
  let alpha, beta;
  for (let hr = 0; hr < 24; hr++) {
    const r_x = SL24hours[hr].abnormal;
    const s_x = SL24hours[hr].normal;

    alpha = r_x + a_x * W;
    beta = s_x + (1 - a_x) * W;
    SL24hours[hr].belief = r_x / (r_x + s_x + W);
    SL24hours[hr].disbelief = s_x / (r_x + s_x + W);
    SL24hours[hr].uncertainty = W / (r_x + s_x + W);

    // P(x) = b_x + a_x * u_x
    SL24hours[hr].projected_probability = SL24hours[hr].belief + a_x * SL24hours[hr].uncertainty;

    a_x = alpha / (alpha + beta); // update a_x (base rate)
    // console.log(SL24hours[hr].belief, SL24hours[hr].disbelief, SL24hours[hr].uncertainty);
  }

  a_x = baseRate;
  for (let min = 0; min < 60; min++){
    const r_x = SL60mins[min].abnormal;
    const s_x = SL60mins[min].normal;

    alpha = r_x + a_x * W;
    beta = s_x + (1 - a_x) * W;
    SL60mins[min].belief = r_x / (r_x + s_x + W);
    SL60mins[min].disbelief = s_x / (r_x + s_x + W);
    SL60mins[min].uncertainty = W / (r_x + s_x + W);
    SL60mins[min].projected_probability = SL60mins[min].belief + a_x * SL60mins[min].uncertainty;

    a_x = alpha / (alpha + beta); // update a_x (base rate)
  }
}


export function recomputeSLBBDistribution(normalEventData:any, abnormalEventData:any,
                                    SL24hours:any, SL60mins, W:any, baseRate:any): void {

  let a_x = baseRate;
  let alpha, beta;
  for (let hr = 0; hr < 24; hr++) {
    const r_x = SL24hours[hr].abnormal;
    const s_x = SL24hours[hr].normal;

    alpha = r_x + a_x * W;
    beta = s_x + (1 - a_x) * W;
    SL24hours[hr].belief = r_x / (r_x + s_x + W);
    SL24hours[hr].disbelief = s_x / (r_x + s_x + W);
    SL24hours[hr].uncertainty = W / (r_x + s_x + W);

    a_x = alpha / (alpha + beta); // update a_x (base rate)
  }

  a_x = baseRate;
  for (let min = 0; min < 60; min++){
    const r_x = SL60mins[min].abnormal;
    const s_x = SL60mins[min].normal;

    alpha = r_x + a_x * W;
    beta = s_x + (1 - a_x) * W;
    SL60mins[min].belief = r_x / (r_x + s_x + W);
    SL60mins[min].disbelief = s_x / (r_x + s_x + W);
    SL60mins[min].uncertainty = W / (r_x + s_x + W);

    a_x = alpha / (alpha + beta); // update a_x (base rate)
  }
}
