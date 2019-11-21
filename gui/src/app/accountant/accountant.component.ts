import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from "@angular/router";
import { ApiService } from "../core/api.service";
import { Banker } from '../core/banker';
import { Accountant } from '../core/accountant';
import { FormControl } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MatSnackBar } from '@angular/material';
import { MemberComponent } from '../member/member.component';
import { ReportComponent } from '../report/report.component';
import { TurnoverComponent } from '../turnover/turnover.component';

const PROCESSING_STATUS = ["Sending", "Check session", "Logging", "Getting Data"];

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
  private uuidToAccountant: Map<string, Accountant> = new Map();
  // for radio button
  private dateInfo: Map<string, Object> = new Map();
  private chosenItem: string;

  // status of accountants when scanning
  private statusList: Map<string, string> = new Map();

  private isScanning: boolean = false;
  private isScanningMember: boolean = false;

  @ViewChild(MemberComponent) member;
  @ViewChild(ReportComponent) report;
  @ViewChild(TurnoverComponent) turnOver;

  constructor(private snackBar: MatSnackBar, private router: Router, private apiService: ApiService) { }

  ngOnInit() {
    if(!window.sessionStorage.getItem('token')) {
      this.router.navigate(['login']);
      return;
    }

    // listen evet from apiservice
    this.apiService.receiveMsgEvent.subscribe(message => {
      let jsonString = JSON.parse(JSON.stringify(message));
      if (jsonString.___ConnectError) {
        let errorMsg = "Cannot connect to Server!!!";
        this.snackBar.open(errorMsg, 'Error', {
          duration: 10 * 1000,
        });
      } else {
        switch (jsonString.type) {
          case "reject":
          case "notify": {
            this.changeStatus(jsonString.uuid, jsonString.data);
            break;
          }
          case "resolve": {
            if (jsonString.data.bankerMap != undefined)
              this.parseInitData(jsonString);
            else
              this.parseScanData(jsonString);
            break;
          }
        }
      }
    });

    // fetching data
    this.apiService.initSocket();
    // this.parseData();
  }

  changeStatus(uuid: string, data) {
    if (this.uuidToAccountant.has(uuid)) {
      let accountant = this.uuidToAccountant.get(uuid);
      let accName: string = (accountant.acc_name != "" ? accountant.acc_name : accountant.username);
      if (data.message != undefined) {
        let status = JSON.parse(JSON.stringify(data)).message;
        this.statusList.set(accName.toLowerCase(), status);
      }
    }
    this.isScanning = this.checkScanning();
  }

  onClickMasterScan() {
    // this.parseData();
    this.isScanningMember = false;
    this.startScanning();
  }

  onClickMemberScan() {
    this.isScanningMember = true;
    this.startScanning();
  }

  startScanning() {
    if (this.isScanning) {
      this.apiService.stop();
      return;
    }
    let from = this.datePipe.transform(this.fromDate.value, 'MM/dd/yyyy');
    let to = this.datePipe.transform(this.toDate.value, 'MM/dd/yyyy');
    this.uuidToAccountant.clear();
    this.statusList.clear();
    this.bankerMap.forEach((value, key) => {
      value.child.forEach(accountant => {
        if (accountant.isChecked) {
          let accName: string = (accountant.acc_name != "" ? accountant.acc_name : accountant.username);
          let args = [{
            "id": accountant.id,
            "from_date": from,
            "to_date": to,
            "more_post": { "login_name": window.sessionStorage.getItem('username') }
          }]
          let uuid = this.apiService.sendSocketEvent('scan', args, false);
          this.uuidToAccountant.set(uuid, accountant);
          this.statusList.set(accName.toLowerCase(), "Sending");
          this.isScanning = true;
        }
      });
    });
  }

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
    this.onChangeStatus(item, item.isChecked);
  }

  onChangeStatus(node, value) {
    node.isChecked = value;
    node.child.forEach(child => {
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
      let account: Accountant = new Accountant(scanAccMap[accountId]);
      banker.child.set(accountId, account);
      this.bankerMap.set(bankerId, banker);
    });

    this.report.updateTable();
  }

  parseScanData(message) {
    let data = JSON.parse(JSON.stringify(message.data.accountant[0]));
    let accId = data.accInfo.id;
    let banker = this.bankerMap.get(data.accInfo.banker);

    // console.log(data);
    if (banker != undefined) {
      let account = banker.child.get(accId);
      let members = account.updateScanData(data);

      // update banker data
      banker.data = {};
      banker.child.forEach((value, key) => {
        if (value.data) {
          Object.keys(value.data).forEach(element => {
            if (!banker.data[element]) {
              banker.data[element] = JSON.parse(JSON.stringify(value.data[element]));
            } else {
              let obj = value.data[element];
              Object.keys(obj).forEach(subElement => {
                if (!banker.data[element][subElement]) {
                  banker.data[element][subElement] = JSON.parse(JSON.stringify(obj[subElement]));
                } else {
                  banker.data[element][subElement] = Number(banker.data[element][subElement]) + Number(obj[subElement]);
                }
              });
            }
          });
        }
      });

      // call turnover to udpate value
      this.turnOver.updateTurnOver();

      // clear this in the statusList
      let statusName = (members.length > 0 ? members[0] : account.username);
      this.statusList.delete(statusName.toLowerCase());

      // keep scanning to get member data
      if (members.length < 3) {
        let tmpAccountant = account;
        
        for (let i = 1; i < members.length; i++) {
          tmpAccountant.child.forEach(e => {
            if (e.username.toLowerCase() == e.username.toLowerCase()) {
              tmpAccountant = e;
              return;
            }
          })
        }

        // let acc = tmpAccountant.child[0];
        tmpAccountant.child.forEach(acc => {        
          let get_child_list: { [x: string]: any } = {};
          let args = [{
            "id": account.id,
            "from_date": this.datePipe.transform(this.fromDate.value, 'MM/dd/yyyy'),
            "to_date": this.datePipe.transform(this.toDate.value, 'MM/dd/yyyy'),
            "more_post": {}
          }];
          let more_post = {
            "login_name": window.sessionStorage.getItem('username'),
            "get_child_list": {}
          };
          get_child_list[acc.username.toLowerCase()] = true;
          for (let i = members.length-1; i >= 0; i--) {
            get_child_list[members[i].toLowerCase()] = true;
          }
          more_post.get_child_list = get_child_list;
          args[0].more_post = more_post;
          let uuid = this.apiService.sendSocketEvent('scan', args, false);
          this.statusList.set(acc.username.toLowerCase(), "Sending");
        });
      }

      this.isScanning = this.checkScanning();
    }
  }

  checkScanning(): boolean {
    let result: boolean = false;
    let status: Set<string> = new Set(PROCESSING_STATUS);
    this.statusList.forEach((value, key) => {
      if (status.has(value)) {
        result = true;
        return;
      }
    });
    return result;
  }

  getObjectLength(obj) {
    return Object.keys(obj).length;
  }
}