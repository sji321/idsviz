import {AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import Dygraph from 'dygraphs';
import {DataManagementService} from '../database/data-management.service';
import {DataField} from '../database/interfaces';

@Component({
  selector: 'app-original-data-chart',
  templateUrl: './original-data-chart.component.html',
  styleUrls: ['./original-data-chart.component.css']
})
export class OriginalDataChartComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('linechart', {static: false}) linechart: ElementRef;
  dyGraph: Dygraph;

  constructor(private dmService: DataManagementService) {

  }

  ngOnInit(): void {
/*/
    this.dmService.fetchedData
      .subscribe(
        (loaded) => {
          // const plotData = [];
          // plotData.push([data[0][0], data[0][1]]);
          // plotData.push([data[1][0], data[1][1]]);

          if (loaded) {
            const chartData = this.dmService.selectedData;
            const lables =  this.dmService.getSelectedVariableNames();
            this.dyGraph = new Dygraph(
              this.linechart.nativeElement,
              chartData,
              {
                labels: lables,
                // ylabel: 'Average',
                legend: 'always',
                showRangeSelector: true
              }
            );

            // const t = this.linechart.nativeElement.getElementsByClassName('.dygraph-label-rotate-left');
            // t.setStyle().setAttribute('style', '.dygraph-label-rotate-left {text-align: center; transform: rotate(90deg); \
            //   -webkit-transform: rotate(90deg); \
            //   -moz-transform: rotate(90deg); \
            //   -o-transform: rotate(90deg); \
            //   -ms-transform: rotate(90deg)}');

            // this.linechart.nativeElement.setStyle({
            //   .dygraph-label-rotate-left {text-align: center; transform: rotate(90deg);
            //   -webkit-transform: rotate(90deg);
            //   -moz-transform: rotate(90deg);
            //   -o-transform: rotate(90deg);
            //   -ms-transform: rotate(90deg)
            // });

            // const activeDiv = this.linechart.nativeElement.querySelector('.dygraph-label-rotate-left');
            // activeDiv.setAttribute('style', 'color:red; text-align: center;');

            // this.dyGraph.setStyle(' color:red;');

            // this.linechart.nativeElement.setAttribute('style',
            //   '.dygraph-ylabel {\
            //   color:red; text-align: center; \
            //   transform: rotate(90deg); \
            //   -webkit-transform: rotate(90deg); \
            //   -moz-transform: rotate(90deg); \
            //   -o-transform: rotate(90deg); \
            //   -ms-transform: rotate(90deg)}');

            // this.linechart.nativeElement.setAttribute('dygraph-label-rotate-left',
            //   'text-align: center; \
            //   transform: rotate(90deg); \
            //   -webkit-transform: rotate(90deg); \
            //   -moz-transform: rotate(90deg); \
            //   -o-transform: rotate(90deg); \
            //   -ms-transform: rotate(90deg)');

            // this.linechart.nativeElement

            //
            // this.linechart.nativeElement.setStyle({'.dygraph-label-rotate-left { \
            //   text-align: center; transform: rotate(90deg); \
            //   -webkit-transform: rotate(90deg); \
            //   -moz-transform: rotate(90deg); \
            //   -o-transform: rotate(90deg); \
            //   -ms-transform: rotate(90deg)}'});
          }
        }
      );

 //*/
  }

  ngOnDestroy(): void {
  }

  ngAfterViewInit(): void {
    this.resetChart();

    // Swal.fire(
    //   'Good job!',
    //   'You clicked the button!',
    //   'success'
    // );
    //
    // let data = [
    //   { DATA: "2016-01-22", TOTAL: ["7", "4", "20", "0"] },
    //   { DATA: "2016-01-25", TOTAL: ["3", "2", "10", "0"] },
    //   { DATA: "2016-01-26", TOTAL: ["1", "1", "4", "0"] },
    //   { DATA: "2016-01-27", TOTAL: ["2", "1", "2", "0"] },
    //   { DATA: "2016-02-02", TOTAL: ["1", "1", "1", "0"] },
    //   { DATA: "2016-02-10", TOTAL: ["1", "1", "3", "0"] }];
    //
    // let converted = data.map(function (a) {
    //   return [new Date(a.DATA)].concat(a.TOTAL.map(Number));
    // });
    //
    // const data = ",\n0,0";
    // this.dyGraph = new Dygraph(
    //   this.linechart.nativeElement,
    //   data,
    //   {
    //     ylabel: 'Average',
    //     legend: 'always',
    //     showRangeSelector: true
    //   }
    // );

    // new Dygraph(this.linechart.nativeElement,
    //   [
    //     [ new Date("2009/07/12"), 0.5, 1 ],
    //     [ new Date("2009/07/19"), 0.2, 0.8 ]
    //   ],
    //   {
    //     labels: [ "x", "A", "B" ],
    //     showRangeSelector: true
    //   });
    //
    // const g = new Dygraph(
    //   document.getElementById('demodiv'),
    //   function() {
    //     const zp = function(x) { if (x < 10) { return '0' + x; } else { return x; } };
    //     let r = 'date,parabola,line,another line,sine wave\n';
    //     for (let i = 1; i <= 31; i++) {
    //       r += '200610' + zp(i);
    //       r += ',' + 10 * (i * (31 - i));
    //       r += ',' + 10 * (8 * i);
    //       r += ',' + 10 * (250 - 8 * i);
    //       r += ',' + 10 * (125 + 125 * Math.sin(0.3 * i));
    //       r += '\n';
    //     }
    //     return r;
    //   },
    //   {
    //     labelsDiv: document.getElementById('status'),
    //     labelsSeparateLines: true,
    //     labelsKMB: true,
    //     legend: 'always',
    //     colors: ['rgb(51,204,204)',
    //       'rgb(255,100,100)',
    //       '#00DD55',
    //       'rgba(50,50,200,0.4)'],
    //     width: 640,
    //     height: 480,
    //     title: 'Interesting Shapes',
    //     ylabel: 'Countx',
    //     axisLineColor: 'white',
    //     // drawXGrid: false
    //   }
    // );

  }

  resetChart(): void {
    const data = ",\n0,0";
    this.dyGraph = new Dygraph(
      this.linechart.nativeElement,
      data,
      {
        legend: 'always',
        showRangeSelector: true
      }
    );

    // new Dygraph(
    //   this.linechart.nativeElement,
    //   function() {
    //     const zp = function(x) { if (x < 10) { return '0' + x; } else { return x; } };
    //     let r = 'date,parabola,line,another line,sine wave\n';
    //     for (let i = 1; i <= 31; i++) {
    //       r += '200610' + zp(i);
    //       r += ',' + 10 * (i * (31 - i));
    //       r += ',' + 10 * (8 * i);
    //       r += ',' + 10 * (250 - 8 * i);
    //       r += ',' + 10 * (125 + 125 * Math.sin(0.3 * i));
    //       r += '\n';
    //     }
    //     return r;
    //   },
    //   {
    //     labelsKMB: true,
    //     legend: 'always',
    //     colors: ['rgb(51,204,204)',
    //       'rgb(255,100,100)',
    //       '#00DD55',
    //       'rgba(50,50,200,0.4)'],
    //     width: 640,
    //     height: 480,
    //     title: 'Interesting Shapes',
    //     xlabel: 'Date',
    //     ylabel: 'Count',
    //     axisLineColor: 'white',
    //     // drawXGrid: false
    //   }
    // );
  }

  resetSelectionFilter(): void {
    if (this.dyGraph) {
      this.dyGraph.clearSelection();
      this.dyGraph.resetZoom();
    }
  }
  isDataLoaded(): boolean {
    return (this.dmService.dataLoaded);
  }

  getSummaryDataFields(): DataField[] {
    return (this.dmService.getAllVariables());
  }

  UpdateChart(): void {
    this.dmService.fetchChartData();
  }

  closetest(): void {
  }
}
