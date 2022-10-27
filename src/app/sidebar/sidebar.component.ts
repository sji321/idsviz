import { Component, OnInit } from '@angular/core';
import {DataManagementService} from "../database/data-management.service";
import * as $ from 'jquery';
import {NgbModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";
import Swal from "sweetalert2";

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  public isDataLoadMenuCollapsed = true;
  public isExportMenuCollapsed = true;
  SL_W: any;
  SL_baserate: any;
  modalSLDlg: any;

  constructor(public dmService: DataManagementService,
              private modalDlgService: NgbModal) { }

  ngOnInit(): void {
  }

  LoadCCIDS2017Raw(): void {
    this.dmService.LoadCCIDS2017Raw();
    this.Hide(); // toggling sidebar menu
  }

  LoadCCIDS2017DWT(): void {
    this.dmService.LoadCCIDS2017DWT();
    this.Hide(); // toggling sidebar menu
  }

  Hide() {
    $('body').toggleClass('sidebar-toggled');
    $('.sidebar').toggleClass('toggled');
    if ($('.sidebar').hasClass('toggled')) {
      this.isDataLoadMenuCollapsed = true;
    }
  }

  SLDlg(content) {
    this.SL_W = this.dmService.BionomialBetaDistribution_SubjectiveLogic_Attributes.W;
    this.SL_baserate = this.dmService.BionomialBetaDistribution_SubjectiveLogic_Attributes.BaseRate;

    // open modal dialog
    this.modalSLDlg = this.modalDlgService.open(content, {size: 'lg', ariaLabelledBy: 'modal-basic-title', centered: true});

    // control modal dialog event
    this.modalSLDlg.result.then((result) => {
      // console.log('x');
    }, (reason) => {
      console.log(reason);
    });
  }
  // SLDlg_Cancel() {
  //   this.modalSLDlg.close();
  // }

  SLDlg_Update() {
    this.dmService.UpdateHeatmap(this.SL_W, this.SL_baserate);
    this.modalSLDlg.close();
  }

  changeWEvent(event: any){
    this.SL_W = parseFloat(event.target.value);
  }

  changeBaseRateEvent(event: any){
    if (parseFloat(event.target.value) > 1.0) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Base rate must be in the range of 0.0 ~ 1.0!'
      });
      // this.modalSLDlg.SL_baserate.focus();
      return;
    }
    this.SL_baserate = parseFloat(event.target.value);
  }
}
