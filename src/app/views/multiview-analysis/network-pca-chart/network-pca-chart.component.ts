/**
 * Network Analysis with Principal Component Analysis
 * Author: Dong H Jeong
 * References:  https://observablehq.com/@d3/zoomable-scatterplot   (zoomable scatterplot)
 *
 *
 *  https://bl.ocks.org/yelper/d38ddf461a0175ebd927946d15140947  (range selection - old method)
 *  https://bl.ocks.org/cmgiven/abca90f6ba5f0a14c54d1eb952f8949c
 *  https://d3-graph-gallery.com/graph/interactivity_brush.html
 *  https://bl.ocks.org/FrissAnalytics/539a46e17640613ebeb94598aad0c92d (zooming & brushing)
 *  http://bl.ocks.org/WilliamQLiu/803b712a4d6efbf7bdb4 (text display on items)
 *  http://bootboxjs.com/examples.html
 * Initial: 3/29/2022
 */

import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  QueryList,
  TemplateRef,
  ViewChild,
  ViewChildren
} from '@angular/core';
import {
  addEmptySpace, addHTMLText,
  createCheckbox,
  D3ChartAttributes,
  initD3ChartAttributes,
  updateD3ChartSize, createButton, createForeignObj, btnPressed, btnUnPressed
} from "../../d3ChartAttributes";
import {UserInteractionService} from "../../user-interaction.service";
import {MultiviewAnalysisComponent} from "../multiview-analysis.component";
import {PCA} from 'ml-pca'; // https://github.com/mljs/pca
import {cloneDeep} from 'lodash';
import {D3ScatterplotComponent} from "../d3-scatterplot/d3-scatterplot.component";
import 'jqueryui';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";


@Component({
  selector: 'app-network-pca-chart',
  templateUrl: './network-pca-chart.component.html',
  styleUrls: ['./network-pca-chart.component.css']
})

export class NetworkPCAChartComponent extends D3ScatterplotComponent implements OnInit, AfterViewInit {
  @ViewChild('PCAAttributeSelectionDialog', { read: TemplateRef }) PCAAttributeDlgTemplateTemplate:TemplateRef<any>;
  public uniqueChartIndexKey;
  private dateChecked = true;

  modalSettingDlg: any; // modal dialog (settings)
  btnSetting: any; // button

  constructor(private _parent: MultiviewAnalysisComponent,
              private uiService: UserInteractionService,
              private modalDlgService: NgbModal) {
    super(); // calling parent constructor
  }

  override ngOnInit(): void {
    this.uniqueChartIndexKey = this._parent.uniqueChartIndexKey;
    this.dataInstances = cloneDeep(this._parent.dataInstances); // duplicate selected variables
    this.dataArray = cloneDeep(this._parent.rawDataValueOnly);

    // initialize d3 chart attributes
    this.d3a = initD3ChartAttributes();
    this.d3a.margin = {top: 40, right: 40, bottom: 70, left: 40};
    this.d3a = updateD3ChartSize(this.d3a, 320, 320);
    this.d3a.title = 'PCA: ' + this._parent.txtDataRange;

    this.d3a.colorMap = this._parent.colormap;
    this.d3a.nameChart = 'svg#' + 'pcachart-' + this.uniqueChartIndexKey
 }

  ngAfterViewInit() {
    this.init3ScattplotLayout();
    this.drawSettingButton();
    this.drawd3ScattplotLayout();
    this.drawBottomOptions();

    this.runPCA();
  }

  changeWidthEvent(event: any){
    this.d3a.width = parseFloat(event.target.value);
    this.updateSVG();
    // this.init3ScattplotLayout();
    // this.drawSettingButton();
    // this.drawd3ScattplotLayout();
    // this.drawBottomOptions();
    // this.moveElements();

    this.btnSetting
      .style('x', this.d3a.width + 2, );
  }

  changeHeightEvent(event: any){
    this.d3a.height = parseFloat(event.target.value);
    this.drawd3ScattplotLayout();
  }

  modalDlgUpdate() {

  }

  drawSettingButton(){
    this.btnSetting = createForeignObj(this.d3a.svg, this.d3a.width + 2, -40);
    const div = this.btnSetting.append('xhtml:div')
      .append('div');

    createButton(div,
      '<i class="fa fa-cog"></i>', 'btn-link').on(
      'click', () => {

        // open modal dialog
        this.modalSettingDlg = this.modalDlgService.open(this.PCAAttributeDlgTemplateTemplate, {size: 'sm', ariaLabelledBy: 'modal-basic-title', centered: true});
      }
    );
  }

  drawBottomOptions() {
    const menuHeight = 10;
    const xpos = -5 * this.d3a.gap;
    const ypos = this.d3a.height + 2.5 * menuHeight;

    const fObj = createForeignObj(this.d3a.svg, xpos, ypos);
    const div = fObj.append('xhtml:div')
      .append('div');
    createCheckbox(div,'&nbsp;<span style="font-size: 9pt;">Date</span>').on(
      'change',
      this.clickDateCheckBox.bind(this)
    )

    // this.drawHorzMenus(div);
    // addEmptySpace(div);
    // addEmptySpace(div);
    //
    // createCheckbox(div,'&nbsp;<span style="font-size: 9pt;">Label</span>', false).on(
    //   'change',
    //   this.clickShowLabelCheckBox.bind(this)
    // )
  }

  clickDateCheckBox() {
    this.dateChecked = !this.dateChecked;
    if (this.dateChecked === true){
      // duplicate data
      this.dataArray = cloneDeep(this._parent.rawDataValueOnly);
    } else {
      this.dataArray = this.dataArray.map(function(item){
        // remove Date column (located in the 0th variable)
        return item.splice(1, item.length);
      });
    }
    this.runPCA(); // run PCA again
  }

  clickCloseButton() {
    // console.log('close: ' + this.scatterplotkey);
    this._parent.parentRef.removeChild(this.uniqueChartIndexKey);
  }

  async runPCA() {
    const range = [-1, 1]; // normalize range

    const pca = new PCA(this.dataArray);

    const data = pca.predict(this.dataArray);

    const col0 = data.getColumn(0);
    const col1 = data.getColumn(1);

    const col0minmax = [Math.min(...col0), Math.max(...col0)];
    const col1minmax = [Math.min(...col1), Math.max(...col1)];

    // update PCA position
    // const normData: number[] = [];
    const variation0 = (range[1] - range[0]) / (col0minmax[1] - col0minmax[0]);
    const variation1 = (range[1] - range[0]) / (col1minmax[1] - col1minmax[0]);
    for (let i = 0; i < col0.length; i++) {
      const tmp = [(range[0] + ((col0[i]  - col0minmax[0]) * variation0)),
        (range[0] + ((col1[i]  - col1minmax[0]) * variation1))];
      // normData.push(tmp);
      this.dataInstances[i].x = (range[0] + ((col0[i]  - col0minmax[0]) * variation0));
      this.dataInstances[i].y = (range[0] + ((col1[i]  - col1minmax[0]) * variation1));
    }
    this.moveElements();
  }
}




// // Set the zoom and Pan features: how much you can zoom, on which part, and what to do when there is a zoom
// const zoom = d3.zoom()
//   .scaleExtent([.5, 15])  // This control how much you can unzoom (x0.5) and zoom (x15)
//   .extent([[0, 0], [this.d3a.width, this.d3a.height]])
//   .on('zoom', (e) => {
//       if (e.sourceEvent.altKey === true) { // check if Alt key is pressed
//         const newX = e.transform.rescaleX(this.d3a.xAxisScale);
//         const newY = e.transform.rescaleY(this.d3a.yAxisScale);
//
//         // update axes with these new boundaries
//         this.d3a.xAxis.call(d3.axisBottom(newX));
//         this.d3a.yAxis.call(d3.axisLeft(newY));
//
//         // update circle position
//         scatter
//           .selectAll('circle')
//           .attr('cx', d => newX(d.x))
//           .attr('cy', d => newY(d.y));
//
//         this.drawZoomCancel();
//       }
//     }
//   );
//
// // This add an invisible rect on top of the chart area.
// // This rect can recover pointer events: necessary to understand when the user zoom
// this.d3a.svg.append('rect')
//   .attr('width', this.d3a.width)
//   .attr('height', this.d3a.height)
//   .style('fill', 'none')
//   .style('pointer-events', 'all')
//   .attr('transform', 'translate(' + this.d3a.margin.left + ',' + this.d3a.margin.top + ')')
//   .call(zoom);

// const brush = d3.brush()
//   .extent([[0, 0], [this.d3a.width, this.d3a.height]])
//   .on('start brush', (e) => {
//     if (e.sourceEvent.altKey !== true && e.sourceEvent.ctrlKey !== true) { // check if no special key is pressed
//       const selection = e.selection;
//
//       const x0 = this.d3a.xAxisScale.invert(selection[0][0]);
//       const x1 = this.d3a.xAxisScale.invert(selection[1][0]);
//       const y0 = this.d3a.yAxisScale.invert(selection[1][1]);
//       const y1 = this.d3a.yAxisScale.invert(selection[0][1]);
//
//       console.log(x0 + ' ' + x1 + ' ' + y0 + ' ' + y1);
//       // onBrush(x0, x1, y0, y1)
//     }
//   });
//
// this.d3a.svg.append('g')
//   .attr('class', 'brush')
//   .call(brush);

// https://bl.ocks.org/FrissAnalytics/539a46e17640613ebeb94598aad0c92d
//
// const brush = d3.brush().extent([[0, 0], [this.d3a.width, this.d3a.height]])
//   .on("start", () => { console.log('brush_startEvent();'); })
//   .on("brush", () => { console.log('brush_brushEvent();'); })
//   .on("end", () => { console.log('brush_endEvent();'); })
//   .on("start.nokey", function() {
//     // d3.select(window).on("keydown.brush keyup.brush", null);
//     console.log('start.nokey');
//   });
//
// const BrushingActivation = this.d3a.svg
//   .append("g")
//   .attr("class", "brush")
//   .call(brush);




// clickCancelButton() {
//   // this.btnZoomingCancellation.attr('hidden', 'true');  // button to hide
//
//   if (this.btnZoomingPressed === true) {
//     // update axes with these new boundaries
//     this.d3a.xAxis.call(d3.axisBottom(this.d3a.xAxisScale));
//     this.d3a.yAxis.call(d3.axisLeft(this.d3a.yAxisScale));
//
//     // update circle position
//     this.moveElements();
//   } else if (this.btnBrushingPressed === true) {
//
//   }
//
//   this.btnZoomingCancellation.attr('hidden', 'true');  // button to hide
//   this.btnZoomingCancellation.remove();
//
// }
// enableZoomCancellation() {
//   const btnZoom = createButton(createForeignObjDIV(this.d3a.svg, this.d3a.width + 2, 16),
//     '<i class="fa fa-search"></i>', 'btn-dark').on(
//     'click', () => {
//       if (this.ZoomActivation !== undefined) {
//         this.ZoomActivation.remove();
//       }
//       this.enableBrushing();
//     });
// }

// enableZoomingx() {
//   const btnZoomx = createButton(createForeignObjDIV(this.d3a.svg, this.d3a.width + 2, 16),
//     '<i class="fa fa-search"></i>', 'btn-link').on(
//     'click', () => {
//       console.log('enableZoomButton');
//
//       // disable brushing
//       this.BrushingActivation.remove();
//
//       this.BrushingActivation = this.d3a.svg.append('rect')
//         .attr('width', this.d3a.width)
//         .attr('height', this.d3a.height)
//         .style('fill', 'none')
//         .style('pointer-events', 'all')
//         .attr('transform', 'translate(' + this.d3a.margin.left + ',' + this.d3a.margin.top + ')')
//         .call(
//           d3.zoom()
//             .scaleExtent([.5, 15])  // This control how much you can unzoom (x0.5) and zoom (x15)
//             .extent([[0, 0], [this.d3a.width, this.d3a.height]])
//             .on('zoom', (e) => {
//               const newX = e.transform.rescaleX(this.d3a.xAxisScale);
//               const newY = e.transform.rescaleY(this.d3a.yAxisScale);
//
//               // update axes with these new boundaries
//               this.d3a.xAxis.call(d3.axisBottom(newX));
//               this.d3a.yAxis.call(d3.axisLeft(newY));
//
//               // update circle position
//               this.scatterplot
//                 .selectAll('circle')
//                 .attr('cx', d => newX(d.x))
//                 .attr('cy', d => newY(d.y));
//
//               this.drawZoomingCancelButton();
//             })
//         );
//     }
//   );
//   return;
//
//   const btnZoom = createButton(createForeignObjDIV(this.d3a.svg, this.d3a.width + 2, 16),
//     '<i class="fa fa-search"></i>', 'btn-link').on(
//     'click', () => {
//       console.log('enableZoomButton');
//
//       // disable brushing
//       if (this.BrushingActivation !== undefined) {
//         this.BrushingActivation.remove();
//       }
//       // this.enableZoomCancellation();
//
//       if (this.ZoomActivation === undefined) {
//         // Set the zoom and Pan features: how much you can zoom, on which part, and what to do when there is a zoom
//         const zoom = d3.zoom()
//           .scaleExtent([.5, 15])  // This control how much you can unzoom (x0.5) and zoom (x15)
//           .extent([[0, 0], [this.d3a.width, this.d3a.height]])
//           .on('zoom', (e) => {
//               const newX = e.transform.rescaleX(this.d3a.xAxisScale);
//               const newY = e.transform.rescaleY(this.d3a.yAxisScale);
//
//               // update axes with these new boundaries
//               this.d3a.xAxis.call(d3.axisBottom(newX));
//               this.d3a.yAxis.call(d3.axisLeft(newY));
//
//               // update circle position
//               this.scatterplot
//                 .selectAll('circle')
//                 .attr('cx', d => newX(d.x))
//                 .attr('cy', d => newY(d.y));
//
//               this.drawZoomingCancelButton();
//               // if (e.sourceEvent.altKey === true) { // check if Alt key is pressed
//               // }
//             }
//           );
//
//         // This add an invisible rect on top of the chart area.
//         // This rect can recover pointer events: necessary to understand when the user zoom
//         this.ZoomActivation = this.d3a.svg.append('rect')
//           .attr('width', this.d3a.width)
//           .attr('height', this.d3a.height)
//           .style('fill', 'none')
//           .style('pointer-events', 'all')
//           .attr('transform', 'translate(' + this.d3a.margin.left + ',' + this.d3a.margin.top + ')')
//           .call(zoom);
//       }
//     }
//     // this.enableZoomButton.bind(this)
//   )
//
// }

// enableZoomButton() {
//   console.log('enableZoomButton');
//
//   // disable brushing
//   if (this.BrushingActivation !== undefined) {
//     this.BrushingActivation.remove();
//   }
//
//   if (this.ZoomActivation === undefined) {
//     // Set the zoom and Pan features: how much you can zoom, on which part, and what to do when there is a zoom
//     const zoom = d3.zoom()
//       .scaleExtent([.5, 15])  // This control how much you can unzoom (x0.5) and zoom (x15)
//       .extent([[0, 0], [this.d3a.width, this.d3a.height]])
//       .on('zoom', (e) => {
//           const newX = e.transform.rescaleX(this.d3a.xAxisScale);
//           const newY = e.transform.rescaleY(this.d3a.yAxisScale);
//
//           // update axes with these new boundaries
//           this.d3a.xAxis.call(d3.axisBottom(newX));
//           this.d3a.yAxis.call(d3.axisLeft(newY));
//
//           // update circle position
//           this.scatterplot
//             .selectAll('circle')
//             .attr('cx', d => newX(d.x))
//             .attr('cy', d => newY(d.y));
//
//           this.drawZoomingCancelButton();
//           // if (e.sourceEvent.altKey === true) { // check if Alt key is pressed
//           // }
//         }
//       );
//
//     // This add an invisible rect on top of the chart area.
//     // This rect can recover pointer events: necessary to understand when the user zoom
//     this.ZoomActivation = this.d3a.svg.append('rect')
//       .attr('width', this.d3a.width)
//       .attr('height', this.d3a.height)
//       .style('fill', 'none')
//       .style('pointer-events', 'all')
//       .attr('transform', 'translate(' + this.d3a.margin.left + ',' + this.d3a.margin.top + ')')
//       .call(zoom);
//   } else {
//     //this.ZoomActivation.remove();
//   }
// }
