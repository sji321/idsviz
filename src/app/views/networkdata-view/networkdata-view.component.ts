/**
 * Network Data Views with Dygraphs
 * Author: Dong H Jeong
 * References:
 *   https://ng-bootstrap.github.io/#/components/modal/examples
 *   https://www.npmjs.com/package/ngb-modal-draggable
 *   https://stackblitz.com/edit/angular-ng-boostrap-draggable?file=src%2Fapp%2Fmodal%2Fdraggable-modal.component.ts
 *   https://www.freakyjolly.com/angular-7-8-9-draggable-bootstrap-modals-in-2-steps-tutorial-by-example/
 */
import {
  AfterViewInit,
  Component,
  ComponentRef, Directive,
  ElementRef,
  OnInit,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import {DataManagementService} from '../../database/data-management.service';
import {NetworktrafficChartComponent} from '../networktraffic-chart/networktraffic-chart.component';
import {ModalDismissReasons, NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {DataField} from '../../database/interfaces';
import {NetworktrafficManagmentService} from '../networktraffic-managment.service';
import {MultiviewAnalysisComponent} from '../multiview-analysis/multiview-analysis.component';
import Swal from 'sweetalert2';
import {DynamicNetworkTrafficDataLoaderDirective} from "./dynamic-network-traffic-data-loader.directive";
import {DynamicNetworkTrafficAnalysisChartLoaderDirective} from "./dynamic-network-traffic-analysis-chart-loader.directive";

@Component({
  selector: 'app-networkdata-view',
  templateUrl: './networkdata-view.component.html',
  styleUrls: ['./networkdata-view.component.css']
})

export class NetworkdataViewComponent implements OnInit, AfterViewInit {
  @ViewChild(DynamicNetworkTrafficDataLoaderDirective, { static: true }) dynamicNetworkTrafficDataChart!: DynamicNetworkTrafficDataLoaderDirective;
  @ViewChild(DynamicNetworkTrafficAnalysisChartLoaderDirective, { static: true }) dynamicNetworkTrafficAnalysisChart!: DynamicNetworkTrafficAnalysisChartLoaderDirective;
  private ComponentRefsNetworkCharts = Array<ComponentRef<MultiviewAnalysisComponent>>(); // storing multiple charts
  private childNetworkAnalysisChartKey = 0;
  private modalReference: NgbModalRef;
  private childNetworktrafficChartComponent: any;

  constructor(private dmService: DataManagementService,
              private modalDlgService: NgbModal,
              private networktrafficManagment: NetworktrafficManagmentService) { }

  ngOnInit(): void {
    this.dmService.updateHeatmap
      .subscribe(
        (W: number, BaseRate: number) => {
          this.childNetworktrafficChartComponent.redrawHeatmapView();
        }
      );

    this.dmService.fetchedData
      .subscribe(
        (fetchedData: any) => {
          // fetchedData[0]: variable names
          // fetchedData[1]: normal data
          // fetchedData[2]: abnormal data
          // fetchedData[3]: heatmap24Hours
          // fetchedData[4]: heatmap60Mins

          // if (this.childNetworktrafficChartComponent == undefined) {
            // create a child component
            const childComponentRef = this.dynamicNetworkTrafficDataChart.viewContainerRef.createComponent(NetworktrafficChartComponent);

            // set data to child component
            const childComponent = childComponentRef.instance;
            childComponent.normalEventData = {names: fetchedData[0], data: fetchedData[1]}; // fetched normal event data
            childComponent.abnormalEventData = {names: fetchedData[0], data: fetchedData[2]}; // fetched abnormal event data
            childComponent.heatmap_data24Hours = fetchedData[3]; // generated heatmap hourly data
            childComponent.heatmap_data60Mins = fetchedData[4];  // generated heatmap minutely data
            childComponent.parentRef = this;  // set parent info

            this.childNetworktrafficChartComponent = childComponent;
          // } else {
          //   this.childNetworktrafficChartComponent.normalEventData = {names: fetchedData[0], data: fetchedData[1]}; // fetched normal event data
          //   this.childNetworktrafficChartComponent.abnormalEventData = {names: fetchedData[0], data: fetchedData[2]}; // fetched abnormal event data
          //   this.childNetworktrafficChartComponent.heatmap24HoursData = fetchedData[3]; // generated heatmap hourly data
          //   this.childNetworktrafficChartComponent.heatmap60MinsData = fetchedData[4];  // generated heatmap minutely data
          //   this.childNetworktrafficChartComponent.updateNetworkTraffic();
          // }
        }
      );
  }

  ngAfterViewInit() {
  }

  isDataLoaded(): boolean {
    return (this.dmService.dataLoaded);
  }

  nFormatter(num, digits) {
    if (num == 'Infinity')
      return num;
    if (num < 0.01)
      return 0.0;
    const lookup = [
      { value: 1, symbol: "" },
      { value: 1e3, symbol: "k" },
      { value: 1e6, symbol: "M" },
      { value: 1e9, symbol: "G" },
      { value: 1e12, symbol: "T" },
      { value: 1e15, symbol: "P" },
      { value: 1e18, symbol: "E" }
    ];
    const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
    let item = lookup.slice().reverse().find(function(item) {
      return num >= item.value;
    });
    return item ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol : "0";
  }

  changeAttributes(content: any): void {
    // this.modalReference = this.modalDlgService.open(content, {backdrop: 'static',size: 'lg', keyboard: false, centered: true});

     // backup previously selected variables
    this.dmService.duplicateSelectedVariables();

    // open modal dialog
    // size: 'sm' | 'lg' | 'xl'
    this.modalReference = this.modalDlgService.open(content, {size: 'xl', ariaLabelledBy: 'modal-basic-title', centered: true});

    // control modal dialog event
    this.modalReference.result.then((result) => {
      // console.log('x');
        // this.networktrafficManagment.reset();
        // this.removeAllChartComponents();  // remove all existing chart components
        // this.dmService.fetchChartData();  // update chart data
    }, (reason) => {
      console.log(reason);
    });
    // this.modalDlgService.open(content, {size: 'lg', ariaLabelledBy: 'modal-basic-title'}).result.then((result) => {
    //   this.networktrafficManagment.reset();
    //   this.removeAllChartComponents();  // remove all existing chart components
    //   this.dmService.fetchChartData();  // update chart data
    // }, (reason) => {
    // });
  }

  ApplySelection() {
    if (this.dmService.getSelectedVariableCount() === 1) { // only tiemstamp variable
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Must select at least one variable!'
      });
      return;
    }
    this.networktrafficManagment.reset();
    this.removeAllChartComponents();  // remove all existing chart components
    this.dmService.fetchChartData(); // fetch data based on selected variables
    this.childNetworktrafficChartComponent.redrawHeatmapView();
    this.modalReference.close(); // close modal dialog
  }

  Cancel() {
    this.dmService.restoreSelectedVariables();
    this.modalReference.close(); // close modal dialog
  }

  SelectAll() {
    const variables = this.dmService.getAllVariables();
    variables.forEach((item => {
      if (item.name !== 'Timestamp' && item.disabled == false) {
        item.selected = true;
      }
    }));
  }

  UnselectAll() {
    const variables = this.dmService.getAllVariables();
    variables.forEach((item => {
        if (item.name !== 'Timestamp') {
          item.selected = false;
        }
    }));
  }

  resetZooming() {
    this.networktrafficManagment.resetZooming();
    this.childNetworktrafficChartComponent.resetZooming();
  }

  removeAllChartComponents() {
    this.dynamicNetworkTrafficDataChart.viewContainerRef.clear();
  }

  getSummaryDataFields(): DataField[] {
    return (this.dmService.getAllVariables());
  }

  /**
   * Remove selected child with key
   * @param childUniqueKey child id
   */
  removeChild(childUniqueKey: number){
    if (this.dynamicNetworkTrafficAnalysisChart.viewContainerRef.length < 1) { return; }

    const componentRef = this.ComponentRefsNetworkCharts.filter(
      childTSNE => childTSNE.instance.uniqueChartIndexKey === childUniqueKey
    )[0];

    const vcrIndex: number = this.dynamicNetworkTrafficAnalysisChart.viewContainerRef.indexOf(componentRef.hostView);

    // removing component from container
    this.dynamicNetworkTrafficAnalysisChart.viewContainerRef.remove(vcrIndex);

    // removing component from the list
    this.ComponentRefsNetworkCharts = this.ComponentRefsNetworkCharts.filter(
      childTSNE => childTSNE.instance.uniqueChartIndexKey !== childUniqueKey
    );
  }

  /**
   * Start analyzing the selected network events
   */
  analyzeSelectedData() {

    // fetch data for the selected region
    const [rawDataKeyValue, rawDataValueOnly, rawDataMinMax]
      = this.networktrafficManagment.getSelectedNetworkEventsRawData();

    // fetch selected data range
    const dateRange = this.networktrafficManagment.getSelectedDataRange();

    // create ComponentRef
    const childComponentRef = this.dynamicNetworkTrafficAnalysisChart.viewContainerRef.createComponent(MultiviewAnalysisComponent);

    // set data to child component
    const childComponent = childComponentRef.instance;
    childComponent.dataRange = dateRange;
    childComponent.rawDataKeyValue =  rawDataKeyValue; // set network events
    childComponent.rawDataValueOnly =  rawDataValueOnly; // set network events
    childComponent.rawDataMinMax = rawDataMinMax;
    childComponent.uniqueChartIndexKey = ++this.childNetworkAnalysisChartKey;
    childComponent.parentRef = this;

    // adding child component to array
    this.ComponentRefsNetworkCharts.push(childComponentRef);
  }

}
