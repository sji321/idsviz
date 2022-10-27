import Matrix from 'ml-matrix';

/**
 * Time converstion from UNIX timestamp to time in JavaScript
 * @param UNIX_timestamp
 */
export function timeConverter(UNIX_timestamp){
  var a = new Date(UNIX_timestamp * 1000);
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var year = a.getFullYear();
  var month = months[a.getMonth()];
  var date = a.getDate();
  var hour = a.getHours();
  var min = a.getMinutes();
  var sec = a.getSeconds();
  var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
  return time;
}

/**
 * @public
 * Function that returns an array of matrices of the cases that belong to each class.
 * @param {Matrix} X - dataset (input)
 * @param {Array} y - predictions (target)
 * @return {Array}
 */
export function separateDataByClass(X, y) {
  const featureSize = X.columns;
  const instanceSize = X.rows;
  const classSize = y.length;

  let numClass = 0;  // number of classes

  // determine # of classes
  let totalClasses = new Array(10000); // max upperbound of classes
  for (let i = 0; i < classSize; i++) {
    if (totalClasses[y[i]] === undefined) {
      totalClasses[y[i]] = 0;
      numClass++;
    }
    totalClasses[y[i]]++;
  }

  let separatedData = new Array(numClass);
  let currentIndex = new Array(numClass);
  for (let i = 0; i < numClass; ++i) {
    separatedData[i] = new Matrix(totalClasses[i], featureSize);
    currentIndex[i] = 0;
  }

  for (let i = 0; i < instanceSize; ++i) {
    separatedData[y[i]].setRow(currentIndex[y[i]], X.getRow(i));
    currentIndex[y[i]]++;
  }

  return separatedData;
}
