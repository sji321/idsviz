/**
 * References
 * bayes-classifier
 * https://github.com/mljs/naive-bayes/tree/ffe06b79cf2aa4d03c6557f0211bf06b1c1f198a
 * https://towardsdatascience.com/the-naive-bayes-classifier-how-it-works-e229e7970b84
 * https://stats.stackexchange.com/questions/249762/with-the-naive-bayes-classifier-why-do-we-have-to-normalize-the-probabilities-a
 * ml-matrix
 * https://github.com/mljs/matrix
 *
 */

import { Matrix } from 'ml-matrix';

import { separateDataByClass } from './commonFunctions'

export class NaiveBayes {
  means: any;
  calculatedProbabilities: any;
  calculatedProbabilityDensities: any;

  /**
   * Constructor for the Naive Bayes classifier with Gaussian.
   * @constructor
   */
  constructor() {
  }


  /**
   * Trains the classifier with a data.
   * It measures log probability.
   * @param {Matrix|Array} trainingSet
   * @param {Matrix|Array} trainingLabels
   */
  train_w_LogProbabilityDensity(trainingData, trainingDataClassLabels) {
    var C1 = Math.sqrt(2 * Math.PI); // constant to precalculate the squared root
    trainingData = Matrix.checkMatrix(trainingData);

    if (trainingData.rows !== trainingDataClassLabels.length) {
      throw new RangeError(
        'the size of the training set and the training labels must be the same.'
      );
    }

    const separatedData = separateDataByClass(trainingData, trainingDataClassLabels);
    const calculatedProbabilities = new Array(separatedData.length);
    this.means = new Array(separatedData.length);
    for (let i = 0; i < separatedData.length; ++i) {
      // mean = sum(x)/n * count(x)
      const variable_means = separatedData[i].mean('column');

      // standard deviation = sqrt((sum i to N (x_i – mean(x))^2) / N-1)
      const std = separatedData[i].standardDeviation('column', {
        mean: variable_means
      });

      calculatedProbabilities[i] = new Array(variable_means.length + 1);

      const logPriorProbability = Math.log(
        separatedData[i].rows / trainingData.rows
      );
      calculatedProbabilities[i][0] = logPriorProbability;
      for (let j = 1; j < variable_means.length + 1; ++j) {
        const currentStd = std[j - 1];
        calculatedProbabilities[i][j] = [
          1 / (C1 * currentStd),
          -2 * currentStd * currentStd
        ];
      }

      this.means[i] = variable_means;
    }

    this.calculatedProbabilities = calculatedProbabilities;
  }

  /**
   * Trains the classifier with a data.
   * @param {Matrix|Array} trainingSet
   * @param {Matrix|Array} trainingLabels
   */
  train_w_ProbabilityDensity(trainingData, trainingDataClassLabels) {
    var C1 = Math.sqrt(2 * Math.PI); // constant to precalculate the squared root
    trainingData = Matrix.checkMatrix(trainingData);

    if (trainingData.rows !== trainingDataClassLabels.length) {
      throw new RangeError(
        'the size of the training set and the training labels must be the same.'
      );
    }

    const separatedData = separateDataByClass(trainingData, trainingDataClassLabels);
    const calculatedProbabilityDensities = new Array(separatedData.length);
    this.means = new Array(separatedData.length);
    for (let i = 0; i < separatedData.length; ++i) {
      // mean = sum(x)/n * count(x)
      const variable_means = separatedData[i].mean('column');

      // compute standard deviation for each variable
      // standard deviation = sqrt((sum i to N (x_i – mean(x))^2) / N-1)
      const std = separatedData[i].standardDeviation('column', {
        mean: variable_means
      });

      calculatedProbabilityDensities[i] = new Array(variable_means.length + 1);
      const PriorProbabilityDensity = separatedData[i].rows / trainingData.rows;
      calculatedProbabilityDensities[i][0] = PriorProbabilityDensity;
      for (let j = 1; j < variable_means.length + 1; ++j) {
        const currentStd = std[j - 1];
        calculatedProbabilityDensities[i][j] = [
          1 / (C1 * currentStd),
          -2 * currentStd * currentStd
        ];
      }
      this.means[i] = variable_means;
    }

    this.calculatedProbabilityDensities = calculatedProbabilityDensities;
  }

  train_w_Probability(trainingData, trainingDataClassLabels) {
    var C1 = Math.sqrt(2 * Math.PI); // constant to precalculate the squared root
    trainingData = Matrix.checkMatrix(trainingData);

    if (trainingData.rows !== trainingDataClassLabels.length) {
      throw new RangeError(
        'the size of the training set and the training labels must be the same.'
      );
    }

    const separatedData = separateDataByClass(trainingData, trainingDataClassLabels);
    const calculatedProbabilities = new Array(separatedData.length);
    this.means = new Array(separatedData.length);
    for (let i = 0; i < separatedData.length; ++i) {
      // mean = sum(x)/n * count(x)
      const variable_means = separatedData[i].mean('column');

      // compute standard deviation for each variable
      // standard deviation = sqrt((sum i to N (x_i – mean(x))^2) / N-1)
      const std = separatedData[i].standardDeviation('column', {
        mean: variable_means
      });

      calculatedProbabilities[i] = new Array(variable_means.length + 1);
      const PriorProbability = separatedData[i].rows / trainingData.rows;
      calculatedProbabilities[i][0] = PriorProbability;
      for (let j = 1; j < variable_means.length + 1; ++j) {
        const currentStd = std[j - 1];
        calculatedProbabilities[i][j] = [
          1 / (C1 * currentStd),
          -2 * currentStd * currentStd
        ];
      }

      this.means[i] = variable_means;
    }

    this.calculatedProbabilities = calculatedProbabilities;
  }

  /**
   * Predicts data
   *
   * @param {Matrix|Array} dataset
   * @return {Array}
   */
  predict_w_LogProbability(dataset) {
    dataset = Matrix.checkMatrix(dataset);
    if (dataset.rows === this.calculatedProbabilities[0].length) {
      throw new RangeError(
        'the dataset must have the same features as the training set'
      );
    }

    const predictions = new Array(dataset.rows);
    for (let i = 0; i < predictions.length; ++i) {
      predictions[i] = this.getCurrentClass_w_LogProbability(
        dataset.getRow(i),
        this.means,
        this.calculatedProbabilities
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
  predictClass_w_ProbabilityDensity(dataset) {
    dataset = Matrix.checkMatrix(dataset);
    if (dataset.rows === this.calculatedProbabilities[0].length) {
      throw new RangeError(
        'the dataset must have the same features as the training set'
      );
    }

    const predictions = Matrix.zeros(dataset.rows, 3);

    for (let i = 0; i < predictions.rows; ++i) {
      const tmp = this.getCurrentClassNProbabilityDensity(
        dataset.getRow(i),
        this.means,
        this.calculatedProbabilities
      );
      predictions.set(i, 0, tmp[0]);  // belief
      predictions.set(i, 1, tmp[1]);  // disbelief
      predictions.set(i, 2, tmp[2]);  // uncertainty
    }

    return predictions;
  }



  predictClass_w_Probability(dataset) {
    dataset = Matrix.checkMatrix(dataset);
    if (dataset.rows === this.calculatedProbabilities[0].length) {
      throw new RangeError(
        'the dataset must have the same features as the training set'
      );
    }

    const predictions = Matrix.zeros(dataset.rows, 3);

    for (let i = 0; i < predictions.rows; ++i) {
      const tmp = this.getCurrentClassNProbability(
        dataset.getRow(i),
        this.means,
        this.calculatedProbabilities
      );
      predictions.set(i, 0, tmp[0]);  // belief
      predictions.set(i, 1, tmp[1]);  // disbelief
      predictions.set(i, 2, tmp[2]);  // uncertainty
    }

    return predictions;
  }


  /**
   * @private
   * Function the retrieves a prediction with one case.
   *
   * @param {Array} instance
   * @param {Array} mean - Precalculated means of each class trained
   * @param {Array} classes - Precalculated value of each class (Prior probability and probability function of each feature)
   * @return {number}
   */
  private getCurrentClassNProbabilityDensity(instance, mean, probabilities) {
    const ABNORMAL = 0;
    const NORMAL = 1;
    let beliefProbability = 0;  // probability if the current instance becomes abnormal
    let unbeliefProbability = 0;  // probability if the current instance becomes normal
    let predictedClass = -1;

    // belief probability - determine if the event is abnormal
    let currentBeliefProbability = probabilities[ABNORMAL][0]; // initialize with the prior probability
    for (let j = 1; j < probabilities[0][1].length + 1; ++j) {
      const prob = this.calculateProbabilityDensity(
        instance[j - 1],
        mean[ABNORMAL][j - 1],
        probabilities[ABNORMAL][j][0],
        probabilities[ABNORMAL][j][1]
      );
      currentBeliefProbability *= (prob / probabilities[ABNORMAL][j][0]);
    }

    // disbelief probability - determine if the event is normal
    let currentDisbeliefProbability = probabilities[NORMAL][0]; // initialize with the prior probability
    for (let j = 1; j < probabilities[0][1].length + 1; ++j) {
      const prob = this.calculateProbabilityDensity(
        instance[j - 1],
        mean[NORMAL][j - 1],
        probabilities[NORMAL][j][0],
        probabilities[NORMAL][j][1]
      );
      currentDisbeliefProbability *= (prob / probabilities[NORMAL][j][0]);
    }

    // normalize the probabilities after calculating the probabilities of each hypothesis
    // https://stats.stackexchange.com/questions/249762/with-the-naive-bayes-classifier-why-do-we-have-to-normalize-the-probabilities-a
    // const sumProbability = currentBeliefProbability + currentDisbeliefProbability;
    // currentBeliefProbability = currentBeliefProbability / sumProbability;
    // currentDisbeliefProbability = currentDisbeliefProbability / sumProbability;

    if (currentDisbeliefProbability > currentBeliefProbability) {
      return [NORMAL, currentBeliefProbability, currentDisbeliefProbability];
    }
    return [ABNORMAL, currentBeliefProbability, currentDisbeliefProbability];
  }


  private getCurrentClassNProbability(instance, mean, probabilities) {
    const ABNORMAL = 0;
    const NORMAL = 1;
    let beliefProbability = 0;  // probability if the current instance becomes abnormal
    let unbeliefProbability = 0;  // probability if the current instance becomes normal
    let predictedClass = -1;

    // belief probability - determine if the event is abnormal
    let currentBeliefProbability = probabilities[ABNORMAL][0]; // initialize with the prior probability
    for (let j = 1; j < probabilities[0][1].length + 1; ++j) {
      const prob = this.calculateProbability(
        instance[j - 1],
        mean[ABNORMAL][j - 1],
        probabilities[ABNORMAL][j][0],
        probabilities[ABNORMAL][j][1]
      );
      currentBeliefProbability *= (prob / probabilities[ABNORMAL][j][0]);
    }

    // disbelief probability - determine if the event is normal
    let currentDisbeliefProbability = probabilities[NORMAL][0]; // initialize with the prior probability
    for (let j = 1; j < probabilities[0][1].length + 1; ++j) {
      const prob = this.calculateProbability(
        instance[j - 1],
        mean[NORMAL][j - 1],
        probabilities[NORMAL][j][0],
        probabilities[NORMAL][j][1]
      );
      currentDisbeliefProbability *= (prob / probabilities[NORMAL][j][0]);
    }

    // normalize the probabilities after calculating the probabilities of each hypothesis
    // https://stats.stackexchange.com/questions/249762/with-the-naive-bayes-classifier-why-do-we-have-to-normalize-the-probabilities-a
    // const sumProbability = currentBeliefProbability + currentDisbeliefProbability;
    // currentBeliefProbability = currentBeliefProbability / sumProbability;
    // currentDisbeliefProbability = currentDisbeliefProbability / sumProbability;

    if (currentDisbeliefProbability > currentBeliefProbability) {
      return [NORMAL, currentBeliefProbability, currentDisbeliefProbability];
    }
    return [ABNORMAL, currentBeliefProbability, currentDisbeliefProbability];
  }

  /**
   * @private
   * Function the retrieves a prediction with one case.
   *
   * @param {Array} instance
   * @param {Array} mean - Precalculated means of each class trained
   * @param {Array} classes - Precalculated value of each class (Prior probability and probability function of each feature)
   * @return {number}
   */
  private getCurrentClass_w_LogProbability(instance, mean, probabilities) {
    let maxProbability = 0;
    let predictedClass = -1;

    // going through all precalculated values for the classes
    for (let i = 0; i < probabilities.length; ++i) {
      let currentProbability = probabilities[i][0]; // initialize with the prior probability
      for (let j = 1; j < probabilities[0][1].length + 1; ++j) {
        currentProbability += this.calculateLogProbabilityDensity(
          instance[j - 1],
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
    // return determined class information
    return predictedClass;
  }


  /**
   * @private
   * return the probability of the feature given the class.
   * @param {number} value - value of the feature.
   * @param {number} mean - mean of the feature for the given class.
   * @param {number} C1 - precalculated value of (1 / (sqrt(2*PI) * std)).
   * @param {number} C2 - precalculated value of (2 * std^2) for the denominator of the exponential.
   * @return {number}
   */
  private calculateLogProbabilityDensity(value, mean, C1, C2) {
    return Math.log(this.calculateProbabilityDensity(value, mean, C1, C2));
  }


  /**
   * @private
   * Calculate the probability of the feature given the class.
   * @param {number} value - value of the feature.
   * @param {number} mean - mean of the feature for the given class.
   * @param {number} C1 - precalculated value of (1 / (sqrt(2*PI) * std)).
   * @param {number} C2 - precalculated value of (2 * std^2) for the denominator of the exponential.
   * @return {number}
   */
  private calculateProbabilityDensity(value, mean, C1, C2) {
    const tmp = value - mean;
    // f(x) = (1 / (sqrt(2 * PI) * sigma)) * exp(-((x-mean)^2 / (2 * sigma^2)))
    return C1 * Math.exp((tmp * tmp) / C2);
  }

  private calculateProbability(value, mean, C1, C2) {
    const tmp = value - mean;
    // f(x) = (1 / (sqrt(2 * PI) * sigma)) * exp(-((x-mean)^2 / (2 * sigma^2)))
    return C1 * Math.exp((tmp * tmp) / C2);
  }

  // https://www.baeldung.com/cs/naive-bayes-classification-performance
  // Eliminate the Zero Observations Problem
  // private calculateProbability2(value, mean, C1, C2) {
  //   const tmp = value - mean;
  //   // f(x) = (1 / sqrt(2 * PI) * sigma) * exp(-((x-mean)^2 / (2 * sigma^2)))
  //   return C1 * Math.exp((tmp * tmp) / C2);
  // }

}


