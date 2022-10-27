/// <reference path="../../node_modules/@types/jquery/index.d.ts" />
/// <reference path="../../node_modules/@types/jqueryui/index.d.ts" />

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { SidebarComponent } from './sidebar/sidebar.component';
// import { OriginalDataChartComponent } from './original-data-chart/original-data-chart.component';
import {FormsModule} from '@angular/forms';
import { NetworktrafficChartComponent} from './views/networktraffic-chart/networktraffic-chart.component';
import { NetworkdataViewComponent } from './views/networkdata-view/networkdata-view.component';
import { MultiviewAnalysisComponent } from './views/multiview-analysis/multiview-analysis.component';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import { NetworkPCPChartComponent } from './views/multiview-analysis/network-pcp-chart/network-pcp-chart.component';
import { NetworkPCAChartComponent } from './views/multiview-analysis/network-pca-chart/network-pca-chart.component';
import { DynamicNetworkTrafficDataLoaderDirective } from './views/networkdata-view/dynamic-network-traffic-data-loader.directive';
import { DynamicNetworkTrafficAnalysisChartLoaderDirective } from './views/networkdata-view/dynamic-network-traffic-analysis-chart-loader.directive';
import { NetworkUMAPChartComponent } from './views/multiview-analysis/network-umap-chart/network-umap-chart.component';
import { NetworkTSNEChartComponent } from './views/multiview-analysis/network-tsne-chart/network-tsne-chart.component';
import { D3ScatterplotComponent } from './views/multiview-analysis/d3-scatterplot/d3-scatterplot.component';
import { NetworkdataHeatmapViewComponent } from './views/networkdata-view/networkdata-heatmap-view/networkdata-heatmap-view.component';
import { NetworkHeatmapChartComponent } from './views/multiview-analysis/network-heatmap-chart/network-heatmap-chart.component';

@NgModule({
  declarations: [
    AppComponent,
    SidebarComponent,
    // OriginalDataChartComponent,
    NetworktrafficChartComponent,
    NetworkdataViewComponent,
    MultiviewAnalysisComponent,
    NetworkPCPChartComponent,
    NetworkPCAChartComponent,
    DynamicNetworkTrafficDataLoaderDirective,
    DynamicNetworkTrafficAnalysisChartLoaderDirective,
    NetworkUMAPChartComponent,
    NetworkTSNEChartComponent,
    D3ScatterplotComponent,
    NetworkdataHeatmapViewComponent,
    NetworkHeatmapChartComponent],
  imports: [
    BrowserModule,
    FormsModule,
    NgbModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
