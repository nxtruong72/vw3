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
      if (data.message != undefined) {
        let status = JSON.parse(JSON.stringify(data)).message;
        this.statusList.set(accountant.name, status);
      }
    }
  }

  onClickScan() {
    // this.parseData();
    let from = this.datePipe.transform(this.fromDate.value, 'MM/dd/yyyy');
    let to = this.datePipe.transform(this.toDate.value, 'MM/dd/yyyy');
    this.uuidToAccountant.clear();
    this.statusList.clear();
    this.bankerMap.forEach((value, key) => {
      value.children.forEach(accountant => {
        if (accountant.isChecked) {
          let args = [{
            "id": accountant.id,
            "from_date": from,
            "to_date": to,
            "more_post": { "login_name": window.sessionStorage.getItem('username') }
          }]
          let uuid = this.apiService.sendSocketEvent('scan', args, false);
          this.uuidToAccountant.set(uuid, accountant);
          this.statusList.set(accountant.name, "Sending");
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

    this.report.updateTable();
  }

  parseScanData(message) {
    let data = JSON.parse(JSON.stringify(message.data.accountant[0]));
    let accId = data.accInfo.id;
    let banker = this.bankerMap.get(data.accInfo.banker);

    // console.log(data);
    if (banker != undefined) {
      let account = banker.children.get(accId);

      // update its info
      account.data = data.data;

      // update its child
      data.child.forEach(element => {
        let accountant: Accountant = new Accountant(element.username, element);
        let masterList: Set<string> = new Set();
        account.children.set(accountant.id, accountant);

        // update member component: remove out the master that has data
        if (!masterList.has(accountant.name)) {
          masterList.add(accountant.name);
        }
        this.member.updateMember(masterList);
      });

      // update banker data
      banker.data = {};
      banker.children.forEach((value, key) => {
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
      this.statusList.delete(account.name);
    }
  }

  getObjectLength(obj) {
    return Object.keys(obj).length;
  }
}