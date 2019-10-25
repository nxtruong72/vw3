import { Component, OnInit, Inject } from '@angular/core';
import { Router } from "@angular/router";
import { ApiService } from "../core/api.service";
import { Banker } from '../core/banker';
import { Accountant } from '../core/accountant';
import { FormControl } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MatSnackBar } from '@angular/material';

@Component({
  selector: 'accountant',
  templateUrl: './accountant.component.html',
  styleUrls: ['./accountant.component.css']
})

export class AccountantComponent implements OnInit {
  private bankerMap: Map<string, Banker> = new Map<string, Banker>();
  private fromDate = new FormControl();
  private toDate = new FormControl();
  private datePipe = new DatePipe('en-US');
  private isCheckAll = true;
  private uuidToAccountant: Map<String, Accountant> = new Map();
  // for radio button
  private dateInfo: Map<string, Object> = new Map();
  private chosenItem: string;
  sbCounter: Banker[] = [];
  cfCounter: Banker[] = [];
  lotoCounter: Banker[] = [];
  csnCounter: Banker[] = [];

  constructor(private snackBar: MatSnackBar, private router: Router, private apiService: ApiService) { }

  ngOnInit() {
    // if(!window.sessionStorage.getItem('token')) {
    //   this.router.navigate(['login']);
    //   return;
    // }

    // listen evet from apiservice
    this.apiService.receiveMsgEvent.subscribe(message => {
      if ((JSON.parse(JSON.stringify(message)).___ConnectError)) {
        let errorMsg = "Cannot connect to Server!!!";
        this.snackBar.open(errorMsg, 'Error', {
          duration: 10 * 1000,
        });
      } else if (JSON.parse(JSON.stringify(message)).data.bankerMap != undefined)
        this.parseInitData(message);
      else
        this.parseScanData(message);
    });

    // fetching data
    this.apiService.initSocket();
    // this.parseData();
  }

  onClickScan() {
    let from = this.datePipe.transform(this.fromDate.value, 'MM/dd/yyyy');
    let to = this.datePipe.transform(this.toDate.value, 'MM/dd/yyyy');
    this.uuidToAccountant.clear();
    this.bankerMap.forEach((value, key) => {
      value.children.forEach(accountant => {
        if (accountant.isChecked) {
          let args = [{
            "id": accountant.id,
            "from_date": from,
            "to_date": to,
            "more_post": { "login_name": "av5533" }
          }]
          let uuid = this.apiService.sendSocketEvent('scan', args);
          this.uuidToAccountant.set(uuid, accountant);
        }
      });
    });
  }

  // onClickReport() {
  //   this.apiService.sharedData = this.bankerMap;
  //   this.router.navigate(['report']);
  //   // window.open('report');
  // }

  onRadioButtonChange() {
    this.fromDate = new FormControl(new Date(JSON.parse(JSON.stringify(this.dateInfo.get(this.chosenItem))).from_date));
    this.toDate = new FormControl(new Date(JSON.parse(JSON.stringify(this.dateInfo.get(this.chosenItem))).to_date));
  }

  onCheckAll() {
    this.bankerMap.forEach((value, key) => {
      this.onChangeStatus(value, this.isCheckAll);
    })
  }

  onCheckBoxChange(item) {
    console.log(item);
    this.onChangeStatus(item, item.isChecked);
  }

  onChangeStatus(node, value) {
    node.isChecked = value;
    node.children.forEach(child => {
      this.onChangeStatus(child, value);
    });
  }

  parseInitData(message) {
    let bankerMap = JSON.parse(JSON.stringify(message)).data.bankerMap;
    let scanAccMap = JSON.parse(JSON.stringify(message)).data.scanAccMap;
    let dateInfo = JSON.parse(JSON.stringify(message)).data.dateInfo;

    // get date info
    this.dateInfo.set('today', dateInfo.today);
    this.dateInfo.set('yesterday', dateInfo.yesterday);
    this.dateInfo.set('this_week', dateInfo.this_week);
    this.dateInfo.set('last_week', dateInfo.last_week);
    this.chosenItem = 'today';
    this.onRadioButtonChange();


    // Get banker info
    Object.keys(bankerMap).forEach(bankerId => {
      let banker = new Banker(bankerMap[bankerId]);
      this.bankerMap.set(bankerId, banker);
    });

    // Get accountant info
    Object.keys(scanAccMap).forEach(accountId => {
      let bankerId = scanAccMap[accountId].banker;
      let banker = this.bankerMap.get(bankerId);
      let account: Accountant = new Accountant(accountId, scanAccMap[accountId]);
      banker.children.set(accountId, account);
      this.bankerMap.set(bankerId, banker);
    });
  }

  parseScanData(message) {
    let data = JSON.parse(JSON.stringify(message)).data.accountant[0];
    let accId = data.accInfo.id;
    let banker = this.bankerMap.get(data.accInfo.banker);

    // console.log(data);
    if (banker != undefined) {
      let account = banker.children.get(accId);

      // update its info
      account.sb = data.data.sb;
      account.cf = data.data.cf;
      account.loto = data.data.loto;
      account.csn = data.data.csn;
      // console.log(account.sb);

      // update its child
      data.child.forEach(element => {
        let accountant: Accountant = new Accountant(element.username, element);
        account.children.set(accountant.id, accountant);
      });

      // update back to banker
      banker.children.set(accId, account);

      // update banker data
      banker.sb = banker.cf = banker.loto = banker.csn = undefined;
      banker.children.forEach((value, key) => {
        if (value.sb != undefined) {
          if (banker.sb == undefined)
            banker.sb = {turnover: 0, gross_comm: 0};
          banker.sb.turnover += parseInt(value.sb.turnover);
          banker.sb.gross_comm += parseInt(value.sb.gross_comm);
        }
        if (value.cf != undefined) {
          if (banker.cf == undefined)
            banker.cf = { turnover: 0, gross_comm: 0 };
          banker.cf.turnover += parseInt(value.cf.turnover);
          banker.cf.gross_comm += parseInt(value.cf.gross_comm);
        }
        if (value.csn != undefined) {
          if (banker.csn == undefined)
            banker.csn = { turnover: 0, gross_comm: 0 };
          banker.csn.turnover += parseInt(value.csn.turnover);
          banker.csn.gross_comm += parseInt(value.csn.gross_comm);
        }
        if (value.loto != undefined) {
          if (banker.loto == undefined)
            banker.loto = { turnover: 0, payout: 0 };
          banker.loto.turnover += parseInt(value.loto.turnover);
          banker.loto.payout += parseInt(value.loto.payout);
        }
      });

      // update back to bankerMap
      this.bankerMap.set(banker.id, banker);

      // update counter
      this.sbCounter = [];
      this.cfCounter = [];
      this.lotoCounter = [];
      this.csnCounter = [];
      this.bankerMap.forEach((value, key) => {
        if (value.sb != undefined) {
          this.sbCounter.push(value);
        }
        if (value.cf != undefined) {
          this.cfCounter.push(value);
        }
        if (value.csn != undefined) {
          this.csnCounter.push(value);
        }
        if (value.loto != undefined) {
          this.lotoCounter.push(value);
        }
      });
    }
  }

  parseData() {
    this.apiService.getInitData().subscribe(response => {
      let bankerMap = JSON.parse(JSON.stringify(response)).data.bankerMap;
      let scanAccMap = JSON.parse(JSON.stringify(response)).data.scanAccMap;
      let dateInfo = JSON.parse(JSON.stringify(response)).data.dateInfo;


      // get date info
      this.dateInfo.set('today', dateInfo.today);
      this.dateInfo.set('yesterday', dateInfo.yesterday);
      this.dateInfo.set('this_week', dateInfo.this_week);
      this.dateInfo.set('last_week', dateInfo.last_week);
      this.chosenItem = 'today';

      // Get banker info
      Object.keys(bankerMap).forEach(bankerId => {
        let banker = new Banker(bankerMap[bankerId]);
        this.bankerMap.set(bankerId, banker);
      })

      // Get accountant info
      Object.keys(scanAccMap).forEach(accountId => {
        let bankerId = scanAccMap[accountId].banker;
        let banker = this.bankerMap.get(bankerId);
        let account: Accountant = new Accountant(accountId, scanAccMap[accountId]);
        banker.children.set(accountId, account);
        this.bankerMap.set(bankerId, banker);
      });

      // Get account info
      this.apiService.getDetailData().subscribe(response => {
        this.parseScanData(response);
      });
      this.apiService.getDetailGaData().subscribe(response => {
        this.parseScanData(response);
      });
      this.apiService.getDetailLotoData().subscribe(response => {
        this.parseScanData(response);
      });
    });
  }
}