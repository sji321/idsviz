/// <reference lib="webworker" />
import TSNE from 'tsne-js';

let firstRun = true;

const TSNEModel = new TSNE({
  dim: 2,
  perplexity: 30.0,
  earlyExaggeration: 4.0,
  learningRate: 100.0,
  nIter: 1000,
  metric: 'euclidean'
});

addEventListener('message', ({ data }) => {
  // const response = `worker response to ${data}`;
  // postMessage(response);
  // console.log(data);
  // const msg = data.data;
  // const tmpData = Object.assign([], data.dataset);
  switch (data.type) {
    case 'TSNE_INPUT_DATA':
      TSNEModel.init({
        data: data.dataset, // allocate data
        type: 'dense'
      });
      // isReady();
      break;
    case 'TSNE_RUN':
      // isBusy();
      TSNEModel.perplexity = data.attributes.perplexity;
      TSNEModel.earlyExaggeration = data.attributes.earlyExaggeration;
      TSNEModel.learningRate = data.attributes.learningRate;
      TSNEModel.nIter = data.attributes.nIter;
      TSNEModel.metric = data.attributes.metric;
      if (firstRun) {
        TSNEModel.run();
        firstRun = false;
      } else {
        TSNEModel.rerun();
      }
      // postMessage({
      //   type: 'TSNE_DONE',
      //   data: TSNEModel.getOutputScaled()
      // });
      // isReady();
      break;
    default:
  }
});


// emitted progress events
TSNEModel.on('progressIter', (iter) => {
  // data: [iter, error, gradNorm]
  postMessage({
    type: 'TSNE_PROGRESS_ITER',
    pdata: iter
  });
});

TSNEModel.on('progressStatus', (status) => {
  postMessage({
    type: 'TSNE_PROGRESS_STATUS',
    pdata: status
  });
});

TSNEModel.on('progressData', (pdata) => {
  postMessage({
    type: 'TSNE_PROGRESS_DATA',
    pdata: pdata
  });
});
