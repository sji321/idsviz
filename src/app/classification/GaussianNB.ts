/**
 * References
 * bayes-classifier
 * https://github.com/mljs/naive-bayes/tree/ffe06b79cf2aa4d03c6557f0211bf06b1c1f198a
 * https://towardsdatascience.com/the-naive-bayes-classifier-how-it-works-e229e7970b84
 *
 * ml-matrix
 * https://github.com/mljs/matrix
 *
 *
 * HOW TO USE
 *
 // const model = new GaussianNB();
 // model.train(dataTrain, fetchedAllEventTarget);
 // let predictions2 = model.predictClassNProbability(dataTrain);
 // let predictions = model.predict(dataTrain);
 */

import { Matrix } from 'ml-matrix';

import { separateDataByClass } from './commonFunctions'

export class GaussianNB {
  means: any;
  calculateProbabilities: any;

  /**
   * Constructor for the Gaussian Naive Bayes classifier, the parameters here is just for loading purposes.
   * @constructor
   * @param {object} means
   * @param {object} calculateProbabilities
   */
  constructor(means = null, calculateProbabilities = null) {
    if (means != null && calculateProbabilities != null) {
      this.means = means;
      this.calculateProbabilities = calculateProbabilities;
    }
  }

  /**
   * Function that trains the classifier with a matrix that represents the training set and an array that
   * represents the label of each row in the training set. the labels must be numbers between 0 to n-1 where
   * n represents the number of classes.
   *
   * WARNING: in the case that one class, all the cases in one or more features have the same value, the
   * Naive Bayes classifier will not work well.
   * @param {Matrix|Array} trainingSet
   * @param {Matrix|Array} trainingLabels
   */
  train(trainingData, trainingDataClassLabels) {
    var C1 = Math.sqrt(2 * Math.PI); // constant to precalculate the squared root
    trainingData = Matrix.checkMatrix(trainingData);

    if (trainingData.rows !== trainingDataClassLabels.length) {
      throw new RangeError(
        'the size of the training set and the training labels must be the same.'
      );
    }

    const separatedData = separateDataByClass(trainingData, trainingDataClassLabels);
    const calculateProbabilities = new Array(separatedData.length);
    this.means = new Array(separatedData.length);
    for (let i = 0; i < separatedData.length; ++i) {
      // mean = sum(x)/n * count(x)
      const variable_means = separatedData[i].mean('column');

      // standard deviation = sqrt((sum i to N (x_i – mean(x))^2) / N-1)
      const std = separatedData[i].standardDeviation('column', {
        mean: variable_means
      });

      const logPriorProbability = Math.log(
        separatedData[i].rows / trainingData.rows
      );
      calculateProbabilities[i] = new Array(variable_means.length + 1);

      calculateProbabilities[i][0] = logPriorProbability;
      for (let j = 1; j < variable_means.length + 1; ++j) {
        const currentStd = std[j - 1];
        calculateProbabilities[i][j] = [
          1 / (C1 * currentStd),
          -2 * currentStd * currentStd
        ];
      }

      this.means[i] = variable_means;
    }

    this.calculateProbabilities = calculateProbabilities;
  }

  /**
   * function that predicts each row of the dataset (must be a matrix).
   *
   * @param {Matrix|Array} dataset
   * @return {Array}
   */
  predict(dataset) {
    dataset = Matrix.checkMatrix(dataset);
    if (dataset.rows === this.calculateProbabilities[0].length) {
      throw new RangeError(
        'the dataset must have the same features as the training set'
      );
    }

    const predictions = new Array(dataset.rows);

    for (let i = 0; i < predictions.length; ++i) {
      predictions[i] = getCurrentClass(
        dataset.getRow(i),
        this.means,
        this.calculateProbabilities
      );
    }

    return predictions;
  }

  /**
   * function that predicts each row of the dataset (must be a matrix).
   *
   * @param {Matrix|Array} dataset
   * @return {Matrix}
   */
  predictClassNProbability(dataset) {
    dataset = Matrix.checkMatrix(dataset);
    if (dataset.rows === this.calculateProbabilities[0].length) {
      throw new RangeError(
        'the dataset must have the same features as the training set'
      );
    }

    const predictions = Matrix.zeros(dataset.rows, 2);

    for (let i = 0; i < predictions.rows; ++i) {
      const tmp = getCurrentClassNProbability(
        dataset.getRow(i),
        this.means,
        this.calculateProbabilities
      );
      // predictions[i] = tmp;
    }

    return predictions;
  }

  /**
   * Function that export the NaiveBayes model.
   * @return {object}
   */
  toJSON() {
    return {
      modelName: 'NaiveBayes',
      means: this.means,
      calculateProbabilities: this.calculateProbabilities
    };
  }

  /**
   * Function that create a GaussianNB classifier with the given model.
   * @param {object} model
   * @return {GaussianNB}
   */
  // static load(model) {
  //   if (model.modelName !== 'NaiveBayes') {
  //     throw new RangeError(
  //       'The current model is not a Multinomial Naive Bayes, current model:',
  //       model.name
  //     );
  //   }
  //
  //   return new GaussianNB(true, model);
  // }
}



/**
 * @private
 * Function the retrieves a prediction with one case.
 *
 * @param {Array} currentCase
 * @param {Array} mean - Precalculated means of each class trained
 * @param {Array} classes - Precalculated value of each class (Prior probability and probability function of each feature)
 * @return {number}
 */
function getCurrentClass(currentCase, mean, probabilities) {
  let maxProbability = 0;
  let predictedClass = -1;

  // going through all precalculated values for the classes
  for (let i = 0; i < probabilities.length; ++i) {
    let currentProbability = probabilities[i][0]; // initialize with the prior probability
    for (let j = 1; j < probabilities[0][1].length + 1; ++j) {
      currentProbability += calculateLogProbability(
        currentCase[j - 1],
        mean[i][j - 1],
        probabilities[i][j][0],
        probabilities[i][j][1]
      );
    }

    currentProbability = Math.exp(currentProbability);
    if (currentProbability > maxProbability) {
      maxProbability = currentProbability;
      predictedClass = i;
    }
  }

  return predictedClass;
}


/**
 * @private
 * Function the retrieves a prediction with one case.
 *
 * @param {Array} currentCase
 * @param {Array} mean - Precalculated means of each class trained
 * @param {Array} classes - Precalculated value of each class (Prior probability and probability function of each feature)
 * @return {number}
 */
function getCurrentClassNProbability(currentCase, mean, probabilities) {
  const normal = 0;
  const abnormal = 1;
  let beliefProbability = 0;
  let unbeliefProbability = 0;
  let predictedClass = -1;


  {
    let currentDisbeliefProbability = probabilities[normal][0]; // initialize with the prior probability
    for (let j = 1; j < probabilities[0][1].length + 1; ++j) {
      currentDisbeliefProbability *= calculateProbability(
        currentCase[j - 1], // value
        mean[normal][j - 1],  // mean
        probabilities[normal][j][0],  // C1
        probabilities[normal][j][1]   // C2
      );
    }

    // belief probability - determine if the event is abnormal
    let currentBeliefProbability = probabilities[abnormal][0]; // initialize with the prior probability
    for (let j = 1; j < probabilities[0][1].length + 1; ++j) {
      currentBeliefProbability *= calculateProbability(
        currentCase[j - 1],
        mean[abnormal][j - 1],
        probabilities[abnormal][j][0],
        probabilities[abnormal][j][1]
      );
    }
  }


  // going through all precalculated values for the classes
  // unbelief probability - determine if the event is not abnormal
  let currentDisbeliefProbability = probabilities[normal][0]; // initialize with the prior probability
  for (let j = 1; j < probabilities[0][1].length + 1; ++j) {
    currentDisbeliefProbability += calculateLogProbability(
      currentCase[j - 1],
      mean[normal][j - 1],
      probabilities[normal][j][0],
      probabilities[normal][j][1]
    );
  }
  currentDisbeliefProbability = Math.exp(currentDisbeliefProbability);

  // belief probability - determine if the event is abnormal
  let currentBeliefProbability = probabilities[abnormal][0]; // initialize with the prior probability
  for (let j = 1; j < probabilities[0][1].length + 1; ++j) {
    currentBeliefProbability += calculateLogProbability(
      currentCase[j - 1],
      mean[abnormal][j - 1],
      probabilities[abnormal][j][0],
      probabilities[abnormal][j][1]
    );
  }
  currentBeliefProbability = Math.exp(currentBeliefProbability);

  if (currentDisbeliefProbability > currentBeliefProbability) {
    return [normal, currentBeliefProbability, currentDisbeliefProbability];
  }
  return [abnormal, currentBeliefProbability, currentDisbeliefProbability];



  // for (let i = 0; i < probabilities.length; ++i) {
  //   let currentProbability = probabilities[i][0]; // initialize with the prior probability
  //   for (let j = 1; j < probabilities[0][1].length + 1; ++j) {
  //     currentProbability += calculateLogProbability(
  //       currentCase[j - 1],
  //       mean[i][j - 1],
  //       probabilities[i][j][0],
  //       probabilities[i][j][1]
  //     );
  //   }
  //
  //   currentProbability = Math.exp(currentProbability);
  //   if (currentProbability > beliefProbability) {
  //     beliefProbability = currentProbability;
  //     predictedClass = i;
  //   }
  // }
  //
  // return [predictedClass, maxProbability];
}


/**
 * @private
 * function that retrieves the probability of the feature given the class.
 * @param {number} value - value of the feature.
 * @param {number} mean - mean of the feature for the given class.
 * @param {number} C1 - precalculated value of (1 / (sqrt(2*PI) * std)).
 * @param {number} C2 - precalculated value of (2 * std^2) for the denominator of the exponential.
 * @return {number}
 */
export function calculateLogProbability(value, mean, C1, C2) {
  value = value - mean;
  // f(x) = (1 / sqrt(2 * PI) * sigma) * exp(-((x-mean)^2 / (2 * sigma^2)))
  return Math.log(C1 * Math.exp((value * value) / C2));
}



/**
 * @private
 * function that retrieves the probability of the feature given the class.
 * @param {number} value - value of the feature.
 * @param {number} mean - mean of the feature for the given class.
 * @param {number} C1 - precalculated value of (1 / (sqrt(2*PI) * std)).
 * @param {number} C2 - precalculated value of (2 * std^2) for the denominator of the exponential.
 * @return {number}
 */
export function calculateProbability(value, mean, C1, C2) {
  value = value - mean;
  // f(x) = (1 / sqrt(2 * PI) * sigma) * exp(-((x-mean)^2 / (2 * sigma^2)))
  return C1 * Math.exp((value * value) / C2);
}
