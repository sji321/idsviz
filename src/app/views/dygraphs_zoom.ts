const Dygraph = require('dygraphs');

/*
 * Synchronize zooming and/or selections between a set of dygraphs.
 *
 * Usage:
 *
 *   const g1 = new Dygraph(...),
 *       g2 = new Dygraph(...),
 *       g3 = new Dygraph(...);
 *   Dygraph.synchronize([g1, g2, g3]);
 *
 */


const synchronize = (newDygraphs) => {

  let opts = {
    selection: false,
    zoom: true,
    range: false,
  };
  let dygraphs= [].concat(newDygraphs);
  let prevCallbacks = [];

  let readycount = dygraphs.length;
  for (const g of dygraphs) {
    // @ts-ignore
    g.ready(() => {
      if (--readycount === 0) {
        // store original callbacks
        const callBackTypes = ['drawCallback', 'highlightCallback', 'unhighlightCallback'];
        for (let j = 0; j < dygraphs.length; j++) {
          if (!prevCallbacks[j]) {
            // @ts-ignore
            prevCallbacks[j] = {};
          }
          for (let k = callBackTypes.length - 1; k >= 0; k--) {
            // @ts-ignore
            prevCallbacks[j][callBackTypes[k]] = dygraphs[j].getFunctionOption(callBackTypes[k]);
          }
        }

        // Listen for draw, highlight, unhighlight callbacks.
        if (opts.zoom) {
          attachZoomHandlers(dygraphs, opts, prevCallbacks);
        }

        if (opts.selection) {
          attachSelectionHandlers(dygraphs, prevCallbacks);
        }
      }
    });
  }

  return {
    detach: () => {
      if (!dygraphs) {
        // @ts-ignore
        dygraphs = null;
        // @ts-ignore
        opts = null;
        // @ts-ignore
        prevCallbacks = null;
        return;
      }
      for (let i = 0; i < dygraphs.length; i++) {
        const g = dygraphs[i];
        // @ts-ignore
        if (opts.zoom && prevCallbacks[i] && prevCallbacks[i].callbacks) {
          // @ts-ignore
          g.updateOptions({ drawCallback: prevCallbacks[i].drawCallback });
        }
        // @ts-ignore
        if (opts.selection && prevCallbacks[i] && prevCallbacks[i].highlightCallback && prevCallbacks[i].unhighlightCallback) {
          // @ts-ignore
          g.updateOptions({
            // @ts-ignore
            highlightCallback: prevCallbacks[i].highlightCallback,
            // @ts-ignore
            unhighlightCallback: prevCallbacks[i].unhighlightCallback,
          });
        }
      }
      // release references & make subsequent calls throw.

      // @ts-ignore
      dygraphs = null;
      // @ts-ignore
      opts = null;
      // @ts-ignore
      prevCallbacks = null;
    },
  };
};

function arraysAreEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) { return false; }
  let i = a.length;
  if (i !== b.length) { return false; }
  while (i--) {
    if (a[i] !== b[i]) { return false; }
  }
  return true;
}

function attachZoomHandlers(gs, syncOpts, prevCallbacks) {
  let block = false;
  for (const g of gs) {
    g.updateOptions({
      drawCallback: (me, initial) => {
        if (block || initial) { return; }
        block = true;
        const opts: any = {
          dateWindow: me.xAxisRange(),

        };
        if (syncOpts.range) { opts.valueRange = me.yAxisRange(); }

        for (let j = 0; j < gs.length; j++) {
          if (gs[j] === me) {
            if (prevCallbacks[j] && prevCallbacks[j].drawCallback) {
              // @ts-ignore
              prevCallbacks[j].drawCallback.apply(this, arguments);
            }
            continue;
          }

          // Only redraw if there are new options
          if (arraysAreEqual(opts.dateWindow, gs[j].getOption('dateWindow')) &&
            arraysAreEqual(opts.valueRange, gs[j].getOption('valueRange'))) {
            continue;
          }

          gs[j].updateOptions(opts);
          // console.log(gs[j].xAxisRange());
        }
        block = false;
      },
    }, true /* no need to redraw */);
  }
}

function attachSelectionHandlers(gs, prevCallbacks) {
  let block = false;
  for (const g of gs) {
    g.updateOptions({
      highlightCallback: ({ }, x, { }, { }, seriesName) => {
        if (block) { return; }
        block = true;
        for (let i = 0; i < gs.length; i++) {
          // @ts-ignore
          if (this === gs[i]) {
            if (prevCallbacks[i] && prevCallbacks[i].highlightCallback) {
              // @ts-ignore
              prevCallbacks[i].highlightCallback.apply(this, arguments);
            }
            continue;
          }
          const idx = gs[i].getRowForX(x);
          if (idx !== null) {
            gs[i].setSelection(idx, seriesName);
          }
        }
        block = false;
      },
      unhighlightCallback: () => {
        if (block) { return; }
        block = true;
        for (let i = 0; i < gs.length; i++) {
          // @ts-ignore
          if (this === gs[i]) {
            if (prevCallbacks[i] && prevCallbacks[i].unhighlightCallback) {
              // @ts-ignore
              prevCallbacks[i].unhighlightCallback.apply(this, arguments);
            }
            continue;
          }
          gs[i].clearSelection();
        }
        block = false;
      },
    }, true /* no need to redraw */);
  }
}

Dygraph.synchronize = synchronize;

export default Dygraph;

const syncedGraph: { [graphId: string]: any } = {};
let syncer = null;

import { debounce } from 'lodash';

export const attachGraph = (graphId, gObj) => {
  if (!syncedGraph[graphId]) {
    return;
  }
  syncedGraph[graphId] = gObj;

  syncSet();
};

export const detachGraph = (graphId: string) => {
  if (!graphId) {
    return;
  }

  delete syncedGraph[graphId];
  syncSet();
};

const syncSet = debounce(() => {
  if (syncer) {
    // @ts-ignore
    syncer.detach();
  }

  const newSyncSet = Object.keys(syncedGraph).map((gid) => syncedGraph[gid]);

  if (newSyncSet.length === 0) {
    return;
  }

  syncer = Dygraph.synchronize(newSyncSet, { zoom: true, selection: false });

}, 200);

