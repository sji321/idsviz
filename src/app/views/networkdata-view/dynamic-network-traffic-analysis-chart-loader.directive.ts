import {Directive, ViewContainerRef} from '@angular/core';

@Directive({
  selector: '[appDynamicNetworkTrafficAnalysisChartLoader]'
})
export class DynamicNetworkTrafficAnalysisChartLoaderDirective {

  constructor(public viewContainerRef: ViewContainerRef) { }

}
