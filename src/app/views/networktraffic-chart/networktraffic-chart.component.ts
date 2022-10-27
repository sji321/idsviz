/**
 *
 * References:
 * https://d3-graph-gallery.com/graph/heatmap_style.html
 */

import {
  AfterViewInit,
  Component,
  HostListener,
  OnInit,
  ViewChild
} from '@angular/core';
import {DygraphData} from '../../database/interfaces';
import Dygraph from 'dygraphs';
import {NetworkdataViewComponent} from '../networkdata-view/networkdata-view.component';
import {NetworktrafficManagmentService} from '../networktraffic-managment.service';
import {GaussianNB} from "../../classification/GaussianNB";
import * as d3 from 'd3';
import {Matrix} from "ml-matrix";
import {DataField, DataFieldMinMax, getHoursDiff, SLHeatmap} from '../../database/interfaces';
import {runRangeSLBBDistribution, runSLBBDistribution} from "../../classification/SLBinomialBetaDistribusion";
import {MultiviewAnalysisComponent} from "../multiview-analysis/multiview-analysis.component";

// Darken a color
function darkenColor(colorStr) {
  // Defined in dygraph-utils.js
  const color = Dygraph.toRGB_(colorStr);
  color.r = Math.floor((255 + color.r) / 2);
  color.g = Math.floor((255 + color.g) / 2);
  color.b = Math.floor((255 + color.b) / 2);
  return 'rgb(' + color.r + ',' + color.g + ',' + color.b + ')';
}

// This function draws bars for a single series. See
// multiColumnBarPlotter below for a plotter which can draw multi-series
// bar charts.
function barChartPlotter(e) {
  const ctx = e.drawingContext;
  const points = e.points;
  const yBottom = e.dygraph.toDomYCoord(0);

  ctx.fillStyle = darkenColor(e.color);

  // Find the minimum separation between x-values.
  // This determines the bar width.
  let minSep = Infinity;
  for (let i = 1; i < points.length; i++) {
    const sep = points[i].canvasx - points[i - 1].canvasx;
    if (sep < minSep) {
      minSep = sep;
    }
  }
  const barWidth = Math.floor(2.0 / 3 * minSep);

  // Do the actual plotting.
  for (const p of points) {
    const centerX = p.canvasx;
    ctx.fillRect(centerX - barWidth / 2, p.canvasy, barWidth, yBottom - p.canvasy);
    ctx.strokeRect(centerX - barWidth / 2, p.canvasy, barWidth, yBottom - p.canvasy);
  }
}

@Component({
  selector: 'app-networktraffic-chart',
  templateUrl: './networktraffic-chart.component.html',
  styleUrls: ['./networktraffic-chart.component.css']
})

export class NetworktrafficChartComponent implements OnInit, AfterViewInit {
  normalEventData: DygraphData;
  abnormalEventData: DygraphData;

  heatmap_data24Hours: any;
  heatmap_data60Mins: any;
  heatmap_svg24Hours: any;
  heatmap_svg60Mins: any;
  heatmap_legend: any;
  heatmap_width = 1580; //1200; // ;
  heatmap_height = 80;

  // List of subgroups
  SJsubgroups = ['belief', 'uncertainty', 'disbelief'];

  BinomialBetaDistribution_W = 2;  // default
  BinomialBetaDistribution_BaseRate = 0.5;  // default

  public parentRef: NetworkdataViewComponent;

  constructor(private dygraphManagment: NetworktrafficManagmentService) {
  }

  ngOnInit(): void {
  }

  // synchronize two charts for zooming
  @HostListener('window:semanticZoom', ['$event']) updateZoom(evt: any) {
    // switch (evt.detail.type) {
    //   case 0: // normalEventDataDygraph is changed
    //     if (this.abnormalEventDataDygraph) {
    //       this.abnormalEventDataDygraph.updateOptions({
    //         dateWindow: [evt.detail.minX, evt.detail.maxX]
    //       });
    //     }
    //     break;
    //   case 1: // abnormalEventDataDygraph is changed
    //     if (this.normalEventDataDygraph) {
    //       this.normalEventDataDygraph.updateOptions({
    //         dateWindow: [evt.detail.minX, evt.detail.maxX]
    //       });
    //     }
    //     break;
    // }
  }

  // synchronize two charts for panning
  @HostListener('window:semanticPan', ['$event']) updatePan(evt: any) {
    // switch (evt.detail.type) {
    //   case 0: // normalEventDataDygraph is changed
    //     if (this.abnormalEventDataDygraph) {
    //       this.abnormalEventDataDygraph.updateOptions({
    //         dateWindow: [evt.detail.minX, evt.detail.maxX]
    //       });
    //     }
    //     break;
    //   case 1: // abnormalEventDataDygraph is changed
    //     if (this.normalEventDataDygraph) {
    //       this.normalEventDataDygraph.updateOptions({
    //         dateWindow: [evt.detail.minX, evt.detail.maxX]
    //       });
    //     }
    //     break;
    // }
  }

  ngAfterViewInit(): void {
    this.drawNetworkTraffic();
    this.redrawHeatmapView();
  }

  redrawHeatmapView() {
    this.drawHeatmap24hr();
    this.drawHeatmap60min();
    this.drawHeatmaplegend();
  }

  // runNB() {
  //   const model = new GaussianNB();
  //
  //   this.normalEventData.data.length
  //   this.normalEventData.data
  //   this.abnormalEventData.data
  //   const Xtrain = Matrix.zeros(5, 5);
  //
  //
  //   //: Matrix = this.normalEventData.data;
  //
  //   // model.train(Xtrain, Ytrain);
  //
  //   // var predictions = model.predict(Xtest);
  // }

  drawNetworkTraffic() {
    const graph1 = document.getElementById('normal_linechart');
    if (graph1 != null) {
      const self = this;

      this.dygraphManagment.addChart(new Dygraph(
          graph1, // this.linechart.nativeElement,
          this.normalEventData.data,
          {
            labels: this.normalEventData.names,
            labelsDiv: document.getElementById('status'),
            labelsSeparateLines: false,
            // plotter: barChartPlotter,
            strokeWidth: 1.0,
            // pointSize: 2,
            labelsKMB: true,
            legend: 'always',
            drawCallback(g) {
            //   if (g.xAxisRange()[0] > 0 && g.xAxisRange()[1] > 0 ) {
            // //     const evt = new CustomEvent('semanticPan', {
            // //       detail: {
            // //         type: 0,
            // //         minX: g.xAxisRange()[0],
            // //         maxX: g.xAxisRange()[1]
            // //       }});
            // //     window.dispatchEvent(evt);
            //     console.log('<b>Draw-graph1</b> [' + g.xAxisRange() + ']<br/>');

              // Activated when zooming is on
              if (g.length != undefined) {
                // console.log(self.normalEventData);
                if (g[0].dateWindow_ != null) {
                  // console.log('<b>Zoom</b> [' + g[0].dateWindow_ + ']<br/>');
                  runRangeSLBBDistribution(self.normalEventData, self.abnormalEventData,
                    g[0].dateWindow_,
                    self.heatmap_data24Hours, self.heatmap_data60Mins,
                    self.BinomialBetaDistribution_W, self.BinomialBetaDistribution_BaseRate);
                  self.updateHeatmap();
                }
              }
            //   }
            },
            zoomCallback(minX, maxX, yRanges) {
            //   // const evt = new CustomEvent('semanticZoom', {
            //   //   detail: {
            //   //     type: 0,
            //   //     minX: minX,
            //   //     maxX: maxX,
            //   //     yRanges: yRanges
            //   //   }});
            //   // window.dispatchEvent(evt);
            //    console.log('<b>Zoom</b> [' + minX + ', ' + maxX + ', [' + yRanges + ']]<br/>');
            },
            // ylabel: 'Average',
            // title: this.normalEventData.names[1],
            // showRangeSelector: true,
            interactionModel: Dygraph.defaultInteractionModel
          }
        )
      );
    }

    const graph2 = document.getElementById('abnormal_linechart');
    if (graph2 != null) {
      const self = this;

      this.dygraphManagment.addChart(new Dygraph(
          graph2,
          this.abnormalEventData.data,
          {
            labels: this.abnormalEventData.names,
            labelsDiv: document.getElementById('status'),
            labelsSeparateLines: false,
            labelsKMB: true,
            // legend: 'always',
            drawCallback(g) {
            //   if (g.xAxisRange()[0] > 0 && g.xAxisRange()[1] > 0) {
            //     const evt = new CustomEvent('semanticPan', {
            //       detail: {
            //         type: 1,
            //         minX: g.xAxisRange()[0],
            //         maxX: g.xAxisRange()[1]
            //       }});
            //     window.dispatchEvent(evt);
            //   }
            //

              // activated when panning is on
              if (g.length != undefined) {
                // console.log('<b>Panning</b> [' + g[0].dateWindow_ + ']<br/>');
                runRangeSLBBDistribution(self.normalEventData, self.abnormalEventData,
                  g[0].dateWindow_,
                  self.heatmap_data24Hours, self.heatmap_data60Mins,
                  self.BinomialBetaDistribution_W, self.BinomialBetaDistribution_BaseRate);
                self.updateHeatmap();
              }

              // console.log('drawCallback');
            },
            // zoomCallback(minX, maxX, yRanges) {
            //   const evt = new CustomEvent('semanticZoom', {
            //     detail: {
            //       type: 1,
            //       minX: minX,
            //       maxX: maxX,
            //       yRanges: yRanges
            //     }});
            //   window.dispatchEvent(evt);
            //   // const input = document.getElementById('zoom') as HTMLInputElement;
            //   // input.value = [1, minX, maxX, yRanges].toString();
            //   console.log('<b>Zoom</b> [' + minX + ', ' + maxX + ', [' + yRanges + ']]<br/>');
            // },
            // ylabel: 'Average',
            // title: this.abnormalEventData.names[1],
            showRangeSelector: true
          }
        )
      );
    }

    this.dygraphManagment.updateDataRange();
    // synchronize two charts
    // const sync = dygraphs_zoom.synchronize([this.normalEventDataDygraph, this.abnormalEventDataDygraph]);

  }


  randomdata() {
    let belief = Math.random();
    let disbelief = -1;
    let uncertainty = -1;
    while (disbelief == -1) {
      let tmp = Math.random();
      if (tmp < 1 - belief) {
        disbelief = tmp;
      }
    }
    uncertainty = 1 - (belief + disbelief);

    return [belief, disbelief, uncertainty];
  }

  updateHeatmap() {
    this.heatmap_svg24Hours
      .remove();
    this.drawHeatmap24hr();

    this.heatmap_svg60Mins
      .remove();
    this.drawHeatmap60min();
  }

  drawHeatmap24hr() {
    let margin = {top: 18, right: 0, bottom: 0, left: 0};
    let witdhHeatMap = this.heatmap_width - margin.left - margin.right;
    let heightHeatMap = this.heatmap_height - margin.top - margin.bottom;

    this.heatmap_svg24Hours =  d3.select('#heatmapVIZ24hr')
      .append("svg")
      .attr("width", witdhHeatMap + margin.left + margin.right)
      .attr("height", heightHeatMap + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // List of groups = species here = value of the first column called group on the X axis
    const groups = d3.map(this.heatmap_data24Hours, function(d){return(d.time)}).keys()

    // Build X scales and axis:
    // Add X axis
    const x = d3.scaleBand()
      .domain(groups)
      .range([0, witdhHeatMap])
      .padding([0.01]);

    this.heatmap_svg24Hours.append("g")
      .call(d3.axisTop(x).tickSizeOuter(0));

    // Add Y axis
    const y = d3.scaleLinear()
      .domain([0, 1])
      .range([ heightHeatMap, 0 ]);

    // color palette = one color per subgroup
    const color = d3.scaleOrdinal()
      .domain(this.SJsubgroups)
      .range(['#fc8d59','#ffffbf','#99d594']) // belief, uncertainty, disbelief

    //stack the data? --> stack per subgroup
    const stackedData = d3.stack()
      .keys(this.SJsubgroups)
      (this.heatmap_data24Hours)


    // Show the bars
    this.heatmap_svg24Hours.append("g")
      .selectAll("g")
      // Enter in the stack data = loop key per key = group per group
      .data(stackedData)
      .enter().append("g")
        .attr("fill", function(d) { return color(d.key); })
        .selectAll("rect")
        // enter a second time = loop subgroup per subgroup to add all rectangles
        .data(function(d) { return d; })
        .enter().append("rect")
          .attr("x", function(d) { return x(d.data.time); })
          .attr("y", function(d) {
            return y(d[1]);
          })
          .attr("height", function(d) {
            return y(d[0]) - y(d[1]);
          })
          .attr("width", x.bandwidth());

    // drawing projected probability
    const line = d3.line()
      .x(d => {
        const width = x(1) - x(0);
        return (x(d.time) + (width / 2.));
      })
      .y(d => y(d.projected_probability))
      .curve(d3.curveNatural);

    this.heatmap_svg24Hours.append("path")
      .attr("class", "line")
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-miterlimit", 1)
      .attr("stroke-width", 1)
      .attr("d", line(this.heatmap_data24Hours));


    // Define the div for the tooltip
    const divTooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .attr('style', 'background: #fce2b3')
      .style("opacity", 0);

    this.heatmap_svg24Hours.selectAll("mybar")
      .data(this.heatmap_data24Hours)
      .enter().append("rect")
      .attr("x", function(d) {
        return x(d.time);
      })
      .attr("y", function(d) {
        return 0;
      })
      .attr("height", function(d) {
        return y(0) - y(1);
      })
      .attr("fill", "#69b3a2")
      .attr("opacity", 0.0)
      .attr("width", x.bandwidth())
      .on("mouseover", function(event, d) {
        // divTooltip.style("display", "inline");
        divTooltip.transition()
          .duration(100)
          .style("opacity", 1.0);
        divTooltip.html('Proj.Prob.: ' + d.projected_probability.toFixed(3) + "<br/>"
          + 'Belief: ' + d.belief.toFixed(3) + "<br/>"
          + 'Disbelief: ' + d.disbelief.toFixed(3) + "<br/>"
          + 'Uncertainty: ' + d.uncertainty.toFixed(3) + "<br/>"
        )
        // .style("left", (event.pageX) + "px")
        // .style("top", heightHeatMap / 2  + "px");
        .style("left", (event.pageX) + "px")
        .style("top", (event.pageY) + "px");
      })
      .on("mousemove", function(event) {
        // divTooltip
        //   .style("left", (event.pageX - 34) + "px")
        //   .style("top", (event.pageY - 12) + "px");
        // console.log('.')
      })
      .on("mouseout", function(event) {
        divTooltip.transition()
          .duration(1)
          .style("opacity", 0);
        // divTooltip.style("display", "none");
      });
  }

  drawHeatmaplegend() {

    // if (this.heatmap_legend != undefined) {
    //   this.heatmap_legend.remove();
    // }

    // legend
    this.heatmap_legend = d3.select('#heatmapVIZ24hr')
      .append("svg")
      .attr("width", '100%')
      .attr("height", 120)
      .append("g")
      .attr("transform", 'translate('+this.heatmap_width+', -40)');

    this.heatmap_legend.append("rect").attr("x",20).attr("y",50).attr("width", 10).attr("height", 10).style("fill", "#fc8d59")
    this.heatmap_legend.append("rect").attr("x",20).attr("y",70).attr("width", 10).attr("height", 10).style("fill", "#ffffbf")
    this.heatmap_legend.append("rect").attr("x",20).attr("y",90).attr("width", 10).attr("height", 10).style("fill", "#99d594")
    this.heatmap_legend.append("text").attr("x", 40).attr("y", 55).text("Belief").style("font-size", "13px").attr("alignment-baseline","middle")
    this.heatmap_legend.append("text").attr("x", 40).attr("y", 75).text("Uncertainty").style("font-size", "13px").attr("alignment-baseline","middle")
    this.heatmap_legend.append("text").attr("x", 40).attr("y", 95).text("Disbelief").style("font-size", "13px").attr("alignment-baseline","middle")
  }

  drawHeatmap60min() {
    // const tempdata = new Array();
    // for (let min = 0; min < 60; min++){
    //   const [belief, disbelief, uncertainty] = this.randomdata();
    //   let item = {
    //     'min': min,
    //     'belief': belief, // belief
    //     'uncertainty': uncertainty,  // uncertainty
    //     'disbelief': disbelief, // disbelief
    //   };
    //   tempdata.push(item);
    // }

    let margin = {top: 0, right: 0, bottom: 20, left: 0};
    let width = this.heatmap_width - margin.left - margin.right;
    let height = this.heatmap_height - margin.top - margin.bottom;

    // if (this.heatmap_data60Mins !== undefined)
    //   this.heatmap_data60Mins.remove();

    this.heatmap_svg60Mins = d3.select('#heatmapVIZ60min')
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // List of groups = species here = value of the first column called group on the X axis
    const groups = d3.map(this.heatmap_data60Mins, function(d){return(d.time)}).keys()

    // Build X scales and axis:
    // Add X axis
    const x = d3.scaleBand()
      .domain(groups)
      .range([0, width])
      .padding([0.01]);

    this.heatmap_svg60Mins.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x)
        .tickSizeOuter(0)
        .tickFormat(d => ("0" + d).slice(-2))
      // .call(g => g.selectAll(".tick text")
      //     .attr("x", d => {return (d)})
      );

    // Add Y axis
    const y = d3.scaleLinear()
      .domain([0, 1])
      .range([ height, 0 ]);

    // color palette = one color per subgroup
    const color = d3.scaleOrdinal()
      .domain(this.SJsubgroups)
      .range(['#fc8d59','#ffffbf','#99d594']) // belief, uncertainty, disbelief

    //stack the data? --> stack per subgroup
    const stackedData = d3.stack()
      .keys(this.SJsubgroups)
      (this.heatmap_data60Mins)

    // Show the bars
    this.heatmap_svg60Mins.append("g")
      .selectAll("g")
      // Enter in the stack data = loop key per key = group per group
      .data(stackedData)
      .enter().append("g")
      .attr("fill", function(d) { return color(d.key); })
      .selectAll("rect")
      // enter a second time = loop subgroup per subgroup to add all rectangles
      .data(function(d) { return d; })
      .enter().append("rect")
      .attr("x", function(d) { return x(d.data.time); })
      .attr("y", function(d) { return y(d[1]); })
      .attr("height", function(d) { return y(d[0]) - y(d[1]); })
      .attr("width", x.bandwidth());


    // drawing projected probability
    const line = d3.line()
      .x(d => {
        const width = x(1) - x(0);
        return (x(d.time) + (width / 2.));
      })
      .y(d => y(d.projected_probability))
      .curve(d3.curveNatural);

    this.heatmap_svg60Mins.append("path")
      .attr("class", "line")
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-miterlimit", 1)
      .attr("stroke-width", 1)
      .attr("d", line(this.heatmap_data60Mins));


    // Define the div for the tooltip
    const divTooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .attr('style', 'background: #fce2b3')
      .style("opacity", 0);

    this.heatmap_svg60Mins.selectAll("invisiblebar")
      .data(this.heatmap_data60Mins)
      .enter().append("rect")
      .attr("x", function(d) {
        return x(d.time);
      })
      .attr("y", function(d) {
        return 0;
      })
      .attr("height", function(d) {
        return y(0) - y(1);
      })
      .attr("fill", "#69b3a2")
      .attr("opacity", 0.0)
      .attr("width", x.bandwidth())
      .on("mouseover", function(event, d) {
        // divTooltip.style("display", "inline");
        divTooltip.transition()
          .duration(100)
          .style("opacity", 1.0);
        divTooltip.html('Proj.Prob.: ' + d.projected_probability.toFixed(3) + "<br/>"
          + 'Belief: ' + d.belief.toFixed(3) + "<br/>"
          + 'Disbelief: ' + d.disbelief.toFixed(3) + "<br/>"
          + 'Uncertainty: ' + d.uncertainty.toFixed(3) + "<br/>"
        )
          // .style("left", (event.pageX) + "px")
          // .style("top", heightHeatMap / 2  + "px");
          .style("left", (event.pageX) + "px")
          .style("top", (event.pageY) + "px");
      })
      .on("mousemove", function(event) {
        // divTooltip
        //   .style("left", (event.pageX - 34) + "px")
        //   .style("top", (event.pageY - 12) + "px");
        // console.log('.')
      })
      .on("mouseout", function(event) {
        divTooltip.transition()
          .duration(1)
          .style("opacity", 0);
        // divTooltip.style("display", "none");
      });
  }

  resetZooming() {
    runRangeSLBBDistribution(this.normalEventData, this.abnormalEventData,
      null, // all data are included
      this.heatmap_data24Hours, this.heatmap_data60Mins,
      this.BinomialBetaDistribution_W, this.BinomialBetaDistribution_BaseRate);

    this.updateHeatmap();
  }

}
