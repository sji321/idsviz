/**
 *
 * References:
 *     https://media.githubusercontent.com/media/uwdata/flights-arrow/master/flights-1m.arrow
 */

import {Injectable, EventEmitter, Output} from '@angular/core';
import {DataField, DataFieldMinMax, getHoursDiff, SLHeatmap} from './interfaces';
import {ArrowTable} from "./arrow-table";
import {cloneDeep} from 'lodash';
import {Matrix} from "ml-matrix";
import {GaussianNB} from "../classification/GaussianNB";
import {NaiveBayes} from "../classification/NaiveBayes";
import * as moment from 'moment';
import * as math from 'mathjs';
import {runRangeSLBBDistribution, runSLBBDistribution, recomputeSLBBDistribution} from "../classification/SLBinomialBetaDistribusion";

const timeStampVariable = 'Timestamp'; // default timestamp variable name

@Injectable({
  providedIn: 'root'
})
export class DataManagementService {
  ArrowDB: any = null; // ArrowTable
  dataLoaded = false; // indicator to check if data is loaded or not
  selectedVariables: string[] = []; // store selected variables (except timestamp information)
  fetchedData: any = new EventEmitter<[string[], any[], any[]]>(); // sending fetched data
  @Output() updateHeatmap = new EventEmitter<[number, number]>(); // sending subjective logic attributes
  // selectedData: any;  // manage all selected summary data
  private summaryDataVariables: DataField[] = []; // manage all summary data fields
  private duplicateDataVariables: DataField[] = [];  // used for backing up previously selected variables for modal dialog control
  variableMinMax: DataFieldMinMax[] = [];

  datasetTitle: any;

  fetchedNormalEventData: any;
  fetchedAbnormalEventData: any;

  SubjectiveLogic24Hours: any = new Array();
  SubjectiveLogic60Mins: any = new Array();

  // Attributes used in Subjective Logic
  BionomialBetaDistribution_SubjectiveLogic_Attributes = {
    W: 2,
    BaseRate: 0.5
  };

  constructor() {
  }

  public LoadCCIDS2017DWT() {
    const summaryNormalDatafile = 'assets/data/CICIDS2017_DWTCombined_60S_Normal.arrow';
    const summaryAbnormalDatafile = 'assets/data/CICIDS2017_DWTCombined_60S_Abnormal.arrow';

    this.datasetTitle = 'CICIDS2017_DWT_Combined_60S';

    this.ArrowDB = new ArrowTable(summaryNormalDatafile, summaryAbnormalDatafile);

    this.ArrowDB.loadSummaryData()
      .then((dataFields: any) => {
        console.info('Data loading is done.');
        this.dataLoaded = true;
        this.summaryDataVariables = dataFields;

        const selectedDataVariables = [timeStampVariable, 'F1', 'F2', 'F3'];

        // enable selected variables
        this.summaryDataVariables.forEach(element => {
          selectedDataVariables.forEach(variable => {
            if (element.name == variable) {
              element.selected = true;
            }
          });
        });

        [this.fetchedNormalEventData, this.fetchedAbnormalEventData] = this.fetch60sData(selectedDataVariables);

        // send fetched data using event emitter (event is processed in NetworkdataViewComponent)
        this.fetchedData.emit([selectedDataVariables, this.fetchedNormalEventData, this.fetchedAbnormalEventData,
          this.SubjectiveLogic24Hours, this.SubjectiveLogic60Mins]);
      });
  }

  public LoadCCIDS2017Raw() {
    const summaryNormalDatafile = 'assets/data/CICIDS2017_Combined_60S_Normal.arrow';
    const summaryAbnormalDatafile = 'assets/data/CICIDS2017_Combined_60S_Abnormal.arrow';
    this.datasetTitle = 'CICIDS2017_Raw_Combined_60S';

    this.ArrowDB = new ArrowTable(summaryNormalDatafile, summaryAbnormalDatafile);

    this.ArrowDB.loadSummaryData()
      .then((dataFields: any) => {
        console.info('Data loading is done.');
        this.dataLoaded = true;
        this.summaryDataVariables = dataFields;

        // const selectedDataVariables = [timeStampVariable];
        // this.summaryDataVariables.forEach((item) => {
        //     if (item.disabled == false)
        //       selectedDataVariables.push(item.name);
        // });

        const selectedDataVariables = [timeStampVariable, 'Flow Duration', 'Total Fwd Packets', 'Total Backward Packets'];

        // enable selected variables
        this.summaryDataVariables.forEach(element => {
          selectedDataVariables.forEach(variable => {
            if (element.name == variable) {
              element.selected = true;
            }
          });
        });

        [this.fetchedNormalEventData, this.fetchedAbnormalEventData] = this.fetch60sData(selectedDataVariables);

        // send fetched data using event emitter (event is processed in NetworkdataViewComponent)
        this.fetchedData.emit([selectedDataVariables, this.fetchedNormalEventData, this.fetchedAbnormalEventData,
          this.SubjectiveLogic24Hours, this.SubjectiveLogic60Mins]);
      });
  }

  public determineBionomialProbability(dataFields: string[], normalEventData:any, abnormalEventData:any): void {

    // all data without date information
    const fetchedAllEventData: any[] = [];
    const fetchedAllEventTarget: any[] = [];
    const fetchedAllEventDate: any[] = [];

    // fetching normal event data
    for (let i = 0; i < normalEventData.numRows; i++) {
      const data = normalEventData.get(i);
      if (data === null) continue;
      const dataElement: any[] = [];  // only data values
      const dateElement: any[] = [];  // only date values
      const currentArray = data.toArray();
      for (let j = 0; j < currentArray.length; j++) {
        const value = currentArray[j];
        if (j == 0) {
          dateElement.push(value);  // date
        }
        else {
          dataElement.push(value);  // data
        }
      }
      fetchedAllEventData.push(dataElement);  // adding data element
      fetchedAllEventDate.push(dateElement);  // adding date element
      fetchedAllEventTarget.push(0);  // indicator - 0: normal event
    }
    // fetching abnormal event data
    for (let i = 0; i < abnormalEventData.numRows; i++) {
      const data = abnormalEventData.get(i);
      if (data === null) continue;
      const dataElement: any[] = [];  // only data values
      const dateElement: any[] = [];  // only date values
      const currentArray = data.toArray();
      for (let j = 0; j < currentArray.length; j++) {
        const value = currentArray[j];
        if (j == 0) {
          dateElement.push(value);  // date
        } else {
          dataElement.push(value);  // data
        }
      }
      fetchedAllEventData.push(dataElement);  // adding data element
      fetchedAllEventDate.push(dateElement);  // adding date element
      fetchedAllEventTarget.push(1);  // indicator - 1: abnormal event
    }

    // apply normalization
    // const dataTrain = Matrix.zeros(fetchedAllEventData.length, dataFields.length - 1 /* no date */);
    // for (let i = 0; i < dataTrain.rows; i++) {
    //   for (let j = 0; j < dataTrain.columns; j++) {
    //     const value = fetchedAllEventData[i][j];
    //     const normalized = (value - this.variableMinMax[j].min) / (this.variableMinMax[j].max - this.variableMinMax[j].min);
    //     dataTrain.set(i, j, normalized); // adding normalized value
    //   }
    // }

    // running naive bayes classifier
    // const model = new NaiveBayes();
    // model.train_w_Probability(dataTrain, fetchedAllEventTarget);
    // let predictions = model.predictClass_w_Probability(dataTrain);

    // initialize 24hours probability heatmap
    if (this.SubjectiveLogic24Hours.length > 0)
      this.SubjectiveLogic24Hours.splice(0) // remove all elements if exist
    for (let hr = 0; hr < 24; hr++){
      const item = new SLHeatmap();
      item.time = hr;
      this.SubjectiveLogic24Hours.push(item);
    }

    let eventBeginDate:any = undefined; // used to determine begin date
    let eventEndDate:any = undefined; // used to determine end date
    let totalAbnormal = 0;
    let totalNormal = 0;
    const objectHours: {[key: string]: number} = {};
    const objectTotalHours: {[key: string]: number} = {};
    // determine # of normal / abnormal events in each hour
    for (let i = 0; i < fetchedAllEventDate.length; i++) {
      const date = new Date(+fetchedAllEventDate[i]); // convert UNIX timestamp to time in JavaScript
      const hour = date.getHours();
      if (eventBeginDate == undefined)
        eventBeginDate = date;
      else
        eventEndDate = date;

      // determine total hours that have events
      const idxMonthDayHour = date.getMonth().toString() + '-' + date.getDate().toString() + '_' + date.getHours().toString();
      if (objectTotalHours[idxMonthDayHour] == undefined)
        objectTotalHours[idxMonthDayHour] = 1;
      else
        objectTotalHours[idxMonthDayHour] += 1;

      // determine each hour that have events
      const idxHour = date.getHours().toString();
      if (objectHours[idxHour] == undefined)
        objectHours[idxHour] = 1;
      else
        objectHours[idxHour] += 1;

      // determine # of events in each hour
      const eventType = fetchedAllEventTarget[i];  // 0: normal | 1: abnormal
      if (eventType == 0) {
        this.SubjectiveLogic24Hours[hour].normal++;
        totalNormal ++;
      }
      else {
        this.SubjectiveLogic24Hours[hour].abnormal++;
        totalAbnormal ++;
      }
    }
    // console.log(arrHours..length);
    // https://math.stackexchange.com/questions/1755736/probability-problem-with-multiple-events
    //arrHours; // getHoursDiff(eventBeginDate, eventEndDate);
    const totalHours = Object.keys(objectTotalHours).length;
    // const overallNormalRate = totalNormal / totalHours;
    const overallNormalProbability = totalNormal / (totalNormal + totalAbnormal);
    // 1 - Math.exp(-overallNormalRate * 24);
    // const overallAbnormalRate = totalAbnormal / totalHours;
    // const overallAbnormalProbability = 1 - Math.exp(-overallAbnormalRate * 24);
    const overallAbnormalProbability = totalAbnormal / (totalNormal + totalAbnormal);

    for (let hr = 0; hr < 24; hr++){
      const n = objectHours[hr];
      if (objectHours[hr] != undefined) {
        this.SubjectiveLogic24Hours[hr].normalProbability  =
          math.combinations(n, this.SubjectiveLogic24Hours[hr].normal)
          * overallNormalProbability ** this.SubjectiveLogic24Hours[hr].normal
          * (1 - overallNormalProbability) ** ( n - this.SubjectiveLogic24Hours[hr].normal );
        this.SubjectiveLogic24Hours[hr].abnormalProbability  =
          math.combinations(n, this.SubjectiveLogic24Hours[hr].abnormal)
          * overallAbnormalProbability ** this.SubjectiveLogic24Hours[hr].abnormal
          * (1 - overallAbnormalProbability) ** ( n - this.SubjectiveLogic24Hours[hr].abnormal );
      }
      else {
        this.SubjectiveLogic24Hours[hr].normalProbability = 0;
        this.SubjectiveLogic24Hours[hr].abnormalProbability = 0;
      }

      console.log('N: ', math.combinations(n, this.SubjectiveLogic24Hours[hr].normal),
        overallNormalProbability ** this.SubjectiveLogic24Hours[hr].normal,
        (1 - overallNormalProbability) ** ( n - this.SubjectiveLogic24Hours[hr].normal ));

      console.log('A: ', math.combinations(n, this.SubjectiveLogic24Hours[hr].abnormal),
        overallAbnormalProbability ** this.SubjectiveLogic24Hours[hr].abnormal,
        (1 - overallAbnormalProbability) ** ( n - this.SubjectiveLogic24Hours[hr].abnormal ))

      console.log(this.SubjectiveLogic24Hours[hr].normalProbability,
        this.SubjectiveLogic24Hours[hr].abnormalProbability)
    }


    // this.BayesianHourlyProbability(this.SubjectiveLogic24Hours, predictions, fetchedAllEventDate, fetchedAllEventTarget);
    //
    // // initialize 60 minutes heatmap
    // if (this.SubjectiveLogic60Mins.length > 0)
    //   this.SubjectiveLogic60Mins.splice(0) // remove all elements if exist
    // for (let min = 0; min < 60; min++){
    //   const item = new SLHeatmap();
    //   item.time = min;
    //   this.SubjectiveLogic60Mins.push(item);
    // }
    // this.BayesianMinutelyProbability(this.SubjectiveLogic60Mins, predictions, fetchedAllEventDate, fetchedAllEventTarget);
    //
  }


  /**
   * Determine min& max of each variable
   * @param dataFields
   * @param normalEventData
   * @param abnormalEventData
   */
  public determineMinMax(dataFields: string[], normalEventData:any, abnormalEventData:any): void {

    this.variableMinMax = []; // clear all elements

    // fetching normal event data
    for (let i = 0; i < normalEventData.numRows; i++) {
      const data = normalEventData.get(i);
      if (data === null) continue;

      const currentArray = data.toArray();
      for (let j = 1; j < currentArray.length; j++) { // skip date field (j == 0)
        const value = currentArray[j];

        let minmaxIdx = j - 1;  // start from 0 ~ n-1
        if (this.variableMinMax[minmaxIdx] == undefined) {
          // adding an minmax item
          let temp: DataFieldMinMax = {
            variableName: dataFields[j], min: value, max: value
          };
          this.variableMinMax.push(temp);
        }
        else {
          // adding data to determine min & max value
          if (this.variableMinMax[minmaxIdx].min > value) this.variableMinMax[minmaxIdx].min = value;
          if (this.variableMinMax[minmaxIdx].max < value) this.variableMinMax[minmaxIdx].max = value;
        }
      }
    }

    // fetching abnormal event data
    for (let i = 0; i < abnormalEventData.numRows; i++) {
      const data = abnormalEventData.get(i);
      if (data === null) continue;
      const currentArray = data.toArray();
      for (let j = 1; j < currentArray.length; j++) { // skip date field (j == 0)
        const value = currentArray[j];

        let minmaxIdx = j - 1;  // start from 0 ~ n-1
        if (this.variableMinMax[minmaxIdx] == undefined) {
          // adding an minmax item
          let temp: DataFieldMinMax = {
            variableName: dataFields[j], min: value, max: value
          };
          this.variableMinMax.push(temp);
        }
        else {
          // adding data to determine min & max value
          if (this.variableMinMax[minmaxIdx].min > value) this.variableMinMax[minmaxIdx].min = value;
          if (this.variableMinMax[minmaxIdx].max < value) this.variableMinMax[minmaxIdx].max = value;
        }
      }
    }
  }

  /**
   * running Naive Bayes
   * @param dataFields
   * @param normalEventData
   * @param abnormalEventData
   */
  public runNaiveBayes(dataFields: string[], normalEventData:any, abnormalEventData:any): void {

    // all data without date information
    const fetchedAllEventData: any[] = [];
    const fetchedAllEventTarget: any[] = [];
    const fetchedAllEventDate: any[] = [];

    // fetching normal event data
    for (let i = 0; i < normalEventData.numRows; i++) {
      const data = normalEventData.get(i);
      if (data === null) continue;
      const dataElement: any[] = [];  // only data values
      const dateElement: any[] = [];  // only date values
      const currentArray = data.toArray();
      for (let j = 0; j < currentArray.length; j++) {
        const value = currentArray[j];
        if (j == 0) {
          dateElement.push(value);  // date
        }
        else {
          dataElement.push(value);  // data
        }
      }
      fetchedAllEventData.push(dataElement);  // adding data element
      fetchedAllEventDate.push(dateElement);  // adding date element
      fetchedAllEventTarget.push(0);  // indicator - 0: normal event
    }
    // fetching abnormal event data
    for (let i = 0; i < abnormalEventData.numRows; i++) {
      const data = abnormalEventData.get(i);
      if (data === null) continue;
      const dataElement: any[] = [];  // only data values
      const dateElement: any[] = [];  // only date values
      const currentArray = data.toArray();
      for (let j = 0; j < currentArray.length; j++) {
        const value = currentArray[j];
        if (j == 0) {
          dateElement.push(value);  // date
        } else {
          dataElement.push(value);  // data
        }
      }
      fetchedAllEventData.push(dataElement);  // adding data element
      fetchedAllEventDate.push(dateElement);  // adding date element
      fetchedAllEventTarget.push(1);  // indicator - 1: abnormal event
    }

    // apply normalization
    const dataTrain = Matrix.zeros(fetchedAllEventData.length, dataFields.length - 1 /* no date */);
    for (let i = 0; i < dataTrain.rows; i++) {
      for (let j = 0; j < dataTrain.columns; j++) {
        const value = fetchedAllEventData[i][j];
        const normalized = (value - this.variableMinMax[j].min) / (this.variableMinMax[j].max - this.variableMinMax[j].min);
        dataTrain.set(i, j, normalized); // adding normalized value
      }
    }

    // running naive bayes classifier
    const model = new NaiveBayes();
    model.train_w_Probability(dataTrain, fetchedAllEventTarget);
    let predictions = model.predictClass_w_Probability(dataTrain);

    // initialize 24hours heatmap
    if (this.SubjectiveLogic24Hours.length > 0)
      this.SubjectiveLogic24Hours.splice(0) // remove all elements if exist
    for (let hr = 0; hr < 24; hr++){
      const item = new SLHeatmap();
      item.time = hr;
      this.SubjectiveLogic24Hours.push(item);
    }
    this.BayesianHourlyProbability(this.SubjectiveLogic24Hours, predictions, fetchedAllEventDate, fetchedAllEventTarget);

    // initialize 60 minutes heatmap
    if (this.SubjectiveLogic60Mins.length > 0)
      this.SubjectiveLogic60Mins.splice(0) // remove all elements if exist
    for (let min = 0; min < 60; min++){
      const item = new SLHeatmap();
      item.time = min;
      this.SubjectiveLogic60Mins.push(item);
    }
    this.BayesianMinutelyProbability(this.SubjectiveLogic60Mins, predictions, fetchedAllEventDate, fetchedAllEventTarget);
  }


  /**
   *
   * @param heatmap Heatmap used to generate visualization
   * @param predictions Matrix
   * @param fetchedAllEventDate // date information for the fetched events
   * @param fetchedAllEventTarget // target information for the fetched events
   * @constructor
   */
  public BayesianMinutelyProbability(heatmap: any[], predictions: any, fetchedAllEventDate: any[], fetchedAllEventTarget: any[]) {
    // // Calculating prior probability
    // const priorProbabilityNormal = normalEventData.numRows / (normalEventData.numRows + abnormalEventData.numRows);
    // const priorProbabilityAbnormal = abnormalEventData.numRows / (normalEventData.numRows + abnormalEventData.numRows);

    // determine # of normal / abnormal events in each hour
    for (let i = 0; i < fetchedAllEventDate.length; i++) {
      const date = new Date(+fetchedAllEventDate[i]); // convert UNIX timestamp to time in JavaScript
      const minute = date.getMinutes();
      const prediction = predictions.getRow(i); // Bayesian probabilities
      const eventType = fetchedAllEventTarget[i];  // 0: normal | 1: abnormal

      if (eventType == 0)
        heatmap[minute].normal++;
      else
        heatmap[minute].abnormal++;
    }

    // determine the default base rate based on # of normal and # of abnormal events
    for (let minute = 0; minute < heatmap.length; minute++) {
      const denominator = heatmap[minute].normal + heatmap[minute].abnormal;
      if (denominator == 0)
        heatmap[minute].baserate;
      else
        heatmap[minute].baserate = heatmap[minute].abnormal / denominator;
    }

    // determine SL per each hour
    for (let i = 0; i < fetchedAllEventDate.length; i++) {
      const date = new Date(+fetchedAllEventDate[i]); // convert UNIX timestamp to time in JavaScript
      const minute = date.getMinutes(); // 0 ~ 59
      const probabilities = predictions.getRow(i); // Bayesian probabilities
      // const eventType = fetchedAllEventTarget[i];  // 0: normal | 1: abnormal

      heatmap[minute].time = minute;

      if (heatmap[minute].belief == 0.0 &&
        heatmap[minute].disbelief == 0.0 &&
        heatmap[minute].uncertainty == 0.0) {
        // set initial values
        heatmap[minute].belief = probabilities[1]; // belief to be abnormal
        heatmap[minute].disbelief = probabilities[2]; // disbelief to to be abnormal
        heatmap[minute].uncertainty = 1.0 - probabilities[1] - probabilities[2];
        heatmap[minute].projected_probability = 0;
      }
      else {
        // apply subjective logic operators
        // addition operator -- page 96
        // multiplication operator -- page 102
        //   Cumulative Fusion Operator
        //  A. Jøsang. A Logic for Uncertain Probabilities. International Journal of Uncertainty, Fuzziness and
        // Knowledge-Based Systems, 9(3):279–311, June 2001.
        // Consensus operator (page 25)
        // Sec. 12.1 (page 207) Belief fusion means precisely to
        // merge multiple opinions, in order to produce a single opinion that is more correct
        // (according to some criteria) than each opinion in isolation

        let omegaA = heatmap[minute]; // call-by-reference
        let omegaB = new SLHeatmap();
        omegaB.belief = probabilities[1];
        omegaB.disbelief = probabilities[2];
        omegaB.uncertainty = 1.0 - probabilities[1] - probabilities[2];

        // Performing Cumulative Fusion Operator
        let denominator = omegaA.uncertainty + omegaB.uncertainty - omegaA.uncertainty * omegaB.uncertainty;
        omegaA.belief = (omegaA.belief * omegaB.uncertainty + omegaB.belief * omegaA.uncertainty) / denominator;
        omegaA.uncertainty = (omegaA.uncertainty * omegaB.uncertainty) / denominator;
        omegaA.baserate = (omegaA.baserate * omegaB.uncertainty + omegaB.baserate * omegaA.uncertainty - (omegaA.baserate + omegaB.baserate) * omegaA.uncertainty * omegaB.uncertainty)
          / (omegaA.uncertainty + omegaB.uncertainty - 2 * omegaA.uncertainty * omegaB.uncertainty); // assumption u_a <> 1 V u_b <> 1
        omegaA.disbelief = 1 - (omegaA.belief + omegaA.uncertainty);
      }
    }

    // projected probability of a binomial opinion P(x) = b_x + a_x * u_x
    // determine projected probability for each minute
    for (let minute = 0; minute < heatmap.length; minute++) {
      heatmap[minute].projected_probability = heatmap[minute].belief + heatmap[minute].baserate * heatmap[minute].uncertainty;
    }
  }


  /**
   *
   * @param heatmap Heatmap used to generate visualization
   * @param predictions Matrix
   * @param fetchedAllEventDate // date information for the fetched events
   * @param fetchedAllEventTarget // target information for the fetched events
   * @constructor
   */
  public BayesianHourlyProbability(heatmap: any[], predictions: any, fetchedAllEventDate: any[], fetchedAllEventTarget: any[]) {

    //
    // // Calculating prior probability
    // const priorProbabilityNormal = normalEventData.numRows / (normalEventData.numRows + abnormalEventData.numRows);
    // const priorProbabilityAbnormal = abnormalEventData.numRows / (normalEventData.numRows + abnormalEventData.numRows);

    // Page 24 - projected probability of a binomial opinion P(x) = b_x + a_x * u_x
    // Page 92 - Table 5.3 Correspondence between SL operators, binary logic / set operators and SL notation
    // Page 96 - Let ωx1 = (bx1 , dx1 , ux1 , ax1 ) and ωx2 = (bx2 , dx2 , ux2 , ax2 ) be two binomial opinions
    // that respectively apply to x1 and x2.
    // Page 207 - Chapter 12 Belief Fusion
    // Page 226 - Cumulative Fusion Operator
    // Page 96 - Addition

    // determine # of normal / abnormal events in each hour
    for (let i = 0; i < fetchedAllEventDate.length; i++) {
      const date = new Date(+fetchedAllEventDate[i]); // convert UNIX timestamp to time in JavaScript
      const hour = date.getHours();
      // const prediction = predictions.getRow(i); // Bayesian probabilities
      const eventType = fetchedAllEventTarget[i];  // 0: normal | 1: abnormal

      if (eventType == 0)
        heatmap[hour].normal++;
      else
        heatmap[hour].abnormal++;
    }

    // determine the default base rate based on # of normal and # of abnormal events
    for (let hour = 0; hour < heatmap.length; hour++) {
      const denominator = heatmap[hour].normal + heatmap[hour].abnormal;
      if (denominator == 0)
        heatmap[hour].baserate;
      else
        heatmap[hour].baserate = heatmap[hour].abnormal / denominator;
    }

    // determine SL per each hour
    for (let i = 0; i < fetchedAllEventDate.length; i++) {
      const date = new Date(+fetchedAllEventDate[i]); // convert UNIX timestamp to time in JavaScript
      const hour = date.getHours();
      const probabilities = predictions.getRow(i); // Bayesian probabilities
      // const eventType = fetchedAllEventTarget[i];  // 0: normal | 1: abnormal

      heatmap[hour].time = hour;

      if (heatmap[hour].belief == 0.0 &&
        heatmap[hour].disbelief == 0.0 &&
        heatmap[hour].uncertainty == 0.0) {
        // set initial values
        heatmap[hour].belief = probabilities[1]; // belief to be abnormal
        heatmap[hour].disbelief = probabilities[2]; // disbelief to to be abnormal
        heatmap[hour].uncertainty = 1.0 - probabilities[1] - probabilities[2];
        heatmap[hour].projected_probability = 0;
      }
      else {
        // apply subjective logic operators
        // addition operator -- page 96
        // multiplication operator -- page 102
        //   Cumulative Fusion Operator
        //  A. Jøsang. A Logic for Uncertain Probabilities. International Journal of Uncertainty, Fuzziness and
        // Knowledge-Based Systems, 9(3):279–311, June 2001.
        // Consensus operator (page 25)
        // Sec. 12.1 (page 207) Belief fusion means precisely to
        // merge multiple opinions, in order to produce a single opinion that is more correct
        // (according to some criteria) than each opinion in isolation

        let omegaA = heatmap[hour]; // call-by-reference
        let omegaB = new SLHeatmap();
        omegaB.belief = probabilities[1];
        omegaB.disbelief = probabilities[2];
        omegaB.uncertainty = 1.0 - probabilities[1] - probabilities[2];

        // if (hour == 23) {
        //   console.log(probabilities[1] + ' ' + probabilities[2]);
        // }

        // Performing Cumulative Fusion Operator
        let denominator = omegaA.uncertainty + omegaB.uncertainty - omegaA.uncertainty * omegaB.uncertainty;
        omegaA.belief = (omegaA.belief * omegaB.uncertainty + omegaB.belief * omegaA.uncertainty) / denominator;
        omegaA.uncertainty = (omegaA.uncertainty * omegaB.uncertainty) / denominator;
        omegaA.baserate = (omegaA.baserate * omegaB.uncertainty + omegaB.baserate * omegaA.uncertainty - (omegaA.baserate + omegaB.baserate) * omegaA.uncertainty * omegaB.uncertainty)
          / (omegaA.uncertainty + omegaB.uncertainty - 2 * omegaA.uncertainty * omegaB.uncertainty); // assumption u_a <> 1 V u_b <> 1
        omegaA.disbelief = 1 - (omegaA.belief + omegaA.uncertainty);
      }
    }

    // projected probability of a binomial opinion P(x) = b_x + a_x * u_x
    // determine projected probability for each hour
    for (let hour = 0; hour < heatmap.length; hour++) {
      heatmap[hour].projected_probability = heatmap[hour].belief + heatmap[hour].baserate * heatmap[hour].uncertainty;
    }
  }

  /**
   * Fetching the secondly data
   * @param dataFields: variable names
   */
  public fetch60sData(dataFields: string[]): any {
    this.updateSelectedVariables(dataFields);

    // fetch two columns data (normal and abnormal by default)
    const [normalEventData, abnormalEventData] = this.ArrowDB.selectSummaryData(dataFields);

    // determine hourly and minutely probability
    // this.determineBionomialProbability(dataFields, normalEventData, abnormalEventData);

    runSLBBDistribution(normalEventData, abnormalEventData,
      this.SubjectiveLogic24Hours, this.SubjectiveLogic60Mins,
      this.BionomialBetaDistribution_SubjectiveLogic_Attributes.W,
      this.BionomialBetaDistribution_SubjectiveLogic_Attributes.BaseRate);

    // // determine min & max in each variable
    // this.determineMinMax(dataFields, normalEventData, abnormalEventData);
    // // run naive bayes
    // this.runNaiveBayes(dataFields, normalEventData, abnormalEventData);

    // fetching normal events
    const fetchedNormalEventData: any[] = [];
    let prevEventDate: Date | null = null;
    let currentEventDate: Date | null = null;
    for (let i = 0; i < normalEventData.numRows; i++) {
      const data = normalEventData.get(i);
      if (data === null) continue;

      const dataElement: any[] = [];
      const nullElement: any[] = [];
      const currentArray = data.toArray();
      currentArray[0] += 14400000; // convert it to US/Eastern time
      for (let j = 0; j < currentArray.length; j++) {
        const value = currentArray[j];
        if (j == 0) {// date time information
          currentEventDate = new Date(value);
          dataElement.push(currentEventDate);
          nullElement.push(new Date(value + 1000));
        } else {
          dataElement.push(value);
          nullElement.push(null);
        }
      }
      if (prevEventDate !== null && currentEventDate !== null) {
        if (Number(currentEventDate) - Number(prevEventDate) > 1000 * 60) {
          // if no activity within the 60 seconds (convert milliseconds to seconds by multiplying 1000),
          // adding null element (for showing a seperated event in line graph).
          fetchedNormalEventData.push(nullElement);
        }
      }
      fetchedNormalEventData.push(dataElement);
      prevEventDate = currentEventDate;
    }

    console.log(fetchedNormalEventData);

    // fetching abnormal events
    const fetchedAbnormalEventData: any[] = [];
    prevEventDate = null;
    currentEventDate = null;
    for (let i = 0; i < abnormalEventData.numRows; i++) {
      const data = abnormalEventData.get(i);
      if (data === null) continue;

      const dataElement: any[] = [];
      const nullElement: any[] = [];
      const currentArray = data.toArray();
      currentArray[0] += 14400000; // convert it to US/Eastern time
      for (let j = 0; j < currentArray.length; j++) {
        const value = currentArray[j];
        if (j == 0) {// date time information
          currentEventDate = new Date(value);
          dataElement.push(currentEventDate);
          nullElement.push(new Date(value + 1000));
        } else {
          dataElement.push(value);
          nullElement.push(null);
        }
      }

      if (prevEventDate !== null && currentEventDate !== null) {
        if (Number(currentEventDate) - Number(prevEventDate) > 1000 * 60 * 5) {
          // no activity within the 1000 * 60 seconds
          fetchedAbnormalEventData.push(nullElement);
        }
      }
      fetchedAbnormalEventData.push(dataElement);
      prevEventDate = currentEventDate;
    }

    const nullArray: any[] = new Array(dataFields.length - 1).fill(null);

    // checking start and end date
    if (fetchedNormalEventData[0][0] < fetchedAbnormalEventData[0][0]) {
      fetchedAbnormalEventData.unshift([new Date(fetchedNormalEventData[0][0]), ...nullArray]);
    }
    if (fetchedNormalEventData[0][0] > fetchedAbnormalEventData[0][0]) {
      fetchedNormalEventData.unshift([new Date(fetchedAbnormalEventData[0][0]), ...nullArray]);
    }
    if (fetchedNormalEventData[fetchedNormalEventData.length - 1] < fetchedAbnormalEventData[fetchedNormalEventData.length - 1]) {
      fetchedNormalEventData.unshift([new Date(fetchedAbnormalEventData[0][0]), ...nullArray]);
    }
    if (fetchedNormalEventData[fetchedNormalEventData.length - 1] < fetchedAbnormalEventData[fetchedNormalEventData.length - 1]) {
      fetchedAbnormalEventData.unshift([new Date(fetchedNormalEventData[0][0]), ...nullArray]);
    }

    return [fetchedNormalEventData, fetchedAbnormalEventData];
  }

  /**
   * Update selected varaibles into a new variable
   * @param dataFields: variable names
   */
  public updateSelectedVariables(dataFields: string[]) {
    this.selectedVariables = [...dataFields];  // duplicate variables
    this.selectedVariables.shift(); // remove timestamp variable
  }

  public getAllVariables(): DataField[] {
    return (this.summaryDataVariables);
  }

  public getAllVariableNames(): string[] {
    const variableNames: string[] = [];
    this.summaryDataVariables.reverse().map(
      (variable) => variableNames.push(variable.name)
    );
    return variableNames;
  }

  public getSelectedVariableNames(): string[] {
    const variableNames: string[] = [];
    this.summaryDataVariables.reverse().map(
      (variable) => {
        if (variable.selected) {
          variableNames.push(variable.name);
        }
      }
    );
    return variableNames;
  }

  public duplicateSelectedVariables() {
    this.duplicateDataVariables = []; // empty
    this.duplicateDataVariables = cloneDeep(this.summaryDataVariables); // duplicate selected variables
  }

  public restoreSelectedVariables() {
    this.summaryDataVariables = []; // empty
    this.summaryDataVariables = cloneDeep(this.duplicateDataVariables); // duplicate selected variables
  }

  public getSelectedVariableCount(): number {
    return this.summaryDataVariables.filter(item => item.selected === true).length;
  }

  public getSummaryDataColData(): any {
    return (this.ArrowDB.summaryDataFields);
  }

  /**
   * fetch chart data
   */
  public fetchChartData(): void {
    // determine selected variables
    let selectedDataVariables: string[] = [];
    this.summaryDataVariables.forEach(
      (variable) => {
        if (variable.name !== timeStampVariable &&
          variable.selected === true) {
          selectedDataVariables.push(variable.name);
        }
      });

    // update selected variables
    this.updateSelectedVariables(selectedDataVariables);

    selectedDataVariables = [timeStampVariable, ...selectedDataVariables];
    // fetch data based on the selected variables
    // this.fetch60sData([timeStampVariable, ...selectedDataVariables]);

    [this.fetchedNormalEventData, this.fetchedAbnormalEventData] = this.fetch60sData(selectedDataVariables);

    // send fetched data using event emitter (event is processed in NetworkdataViewComponent)
    this.fetchedData.emit([selectedDataVariables, this.fetchedNormalEventData, this.fetchedAbnormalEventData,
      this.SubjectiveLogic24Hours, this.SubjectiveLogic60Mins]);
  }

  UpdateHeatmap(W: number, BaseRate: number) {
    this.BionomialBetaDistribution_SubjectiveLogic_Attributes.W = W;
    this.BionomialBetaDistribution_SubjectiveLogic_Attributes.BaseRate = BaseRate;

    recomputeSLBBDistribution(this.fetchedNormalEventData, this.fetchedAbnormalEventData,
      this.SubjectiveLogic24Hours, this.SubjectiveLogic60Mins,
      this.BionomialBetaDistribution_SubjectiveLogic_Attributes.W,
      this.BionomialBetaDistribution_SubjectiveLogic_Attributes.BaseRate);

    this.updateHeatmap.emit([W, BaseRate]);
  }
}
