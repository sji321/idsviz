import {Directive, ViewContainerRef} from '@angular/core';

@Directive({
  selector: '[appDynamicNetworkTrafficDataLoader]'
})
export class DynamicNetworkTrafficDataLoaderDirective {

  constructor(public viewContainerRef: ViewContainerRef) { }

}
