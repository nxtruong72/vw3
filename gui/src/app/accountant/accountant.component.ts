import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from "@angular/router";
import { ApiService } from "../core/api.service";
import { Banker } from '../core/banker';
import { Accountant } from '../core/accountant';
import { FormControl } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MatSnackBar, MatAutocomplete, MatAutocompleteSelectedEvent, MatChipInputEvent } from '@angular/material';
import { MemberComponent } from '../member/member.component';
import { ReportComponent } from '../report/report.component';
import { TurnoverComponent } from '../turnover/turnover.component';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { COMMA, ENTER } from '@angular/cdk/keycodes';

const PROCESSING_STATUS: Set<string> = new Set(["Sending", "Check session", "Logging", "Getting Data"]);

interface Status {
  name: string,
  status: string
}

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
  // for radio button
  private dateInfo: Map<string, Object> = new Map();
  private chosenItem: string;

  // for chosing the customer
  private customerCtrl = new FormControl();
  private customerList: string[] = [];
  private customerChosenList: string[] = [];
  private customerFilter: Observable<string[]>;
  private visible = true;
  private selectable = true;
  private removable = true;
  private addOnBlur = true;
  private separatorKeysCodes: number[] = [ENTER, COMMA];

  // status of accountants when scanning
  private statusList: Map<string, Status> = new Map();

  private isScanning: boolean = false;
  private isScanningMember: boolean = false;

  @ViewChild(MemberComponent) member;
  @ViewChild(ReportComponent) report;
  @ViewChild(TurnoverComponent) turnOver;

  @ViewChild('customerInput') customerInput: ElementRef<HTMLInputElement>;
  @ViewChild('auto') matAutocomplete: MatAutocomplete;

  constructor(private snackBar: MatSnackBar, private router: Router, private apiService: ApiService) {}

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
    if (this.statusList.has(uuid) && data.message) {
      let s = this.statusList.get(uuid);
      s.status = JSON.parse(JSON.stringify(data)).message;
      this.statusList.set(uuid, s);
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
      this.apiService.stopAll();
      return;
    }
    let from = this.datePipe.transform(this.fromDate.value, 'MM/dd/yyyy');
    let to = this.datePipe.transform(this.toDate.value, 'MM/dd/yyyy');
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
          let uuid = this.apiService.sendSocketEvent(undefined, accountant.id, accName, 'scan', args, 0);
          let s: Status = {name: accName.toLowerCase(), status: 'Sending'};
          this.statusList.set(uuid, s);
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
    let memberMap = JSON.parse(JSON.stringify(message)).data.memberMap;

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

    // Mapping customer with bankerMap
    let customerMap: Map<string, Set<string>> = new Map();
    memberMap.forEach(customer => {
      let cusName = customer.member.fullname.toUpperCase();
      let setMember: Set<string> = new Set();
      customer.accounts.forEach(member => {
        let acc_name = member.acc_name.toUpperCase();
        setMember.add(acc_name);
      })
      customerMap.set(cusName, setMember);
      this.customerList.push(cusName);
    })
    this.bankerMap.forEach((banker, bankerId) => {
      banker.child.forEach(sup => {
        let supName = sup.acc_name.toUpperCase();
        customerMap.forEach((members, customer) => {
          if (members.has(supName)) {
            sup.customers.add(customer);
          }
        })
      })
    })
    console.log(this.bankerMap);
    console.log(this.customerList);
    this.customerFilter = this.customerCtrl.valueChanges.pipe(
      startWith(null),
      map((customer: string | null) => customer ? this._filter(customer) : this.customerList.slice())
    );

    this.report.updateTable();
  }

  parseScanData(message) {
    let data = JSON.parse(JSON.stringify(message.data.accountant[0]));
    let accId = data.accInfo.id;
    let banker = this.bankerMap.get(data.accInfo.banker);

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
      this.statusList.delete(message.uuid);

      // keep scanning to get member data
      if (this.isScanningMember && members.length < 3) {
        let tmpAccountant = account;
        
        for (let i = 1; i < members.length; i++) {
          tmpAccountant.child.forEach(e => {
            if (e.username.toLowerCase() == members[i].toLowerCase()) {
              tmpAccountant = e;
              return;
            }
          })
        }

        // let acc = tmpAccountant.child[0];
        tmpAccountant.child.forEach(acc => {
          if (acc.child.length <= 0) {
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
            for (let i = members.length - 1; i >= 0; i--) {
              get_child_list[members[i].toLowerCase()] = true;
            }
            more_post.get_child_list = get_child_list;
            args[0].more_post = more_post;
            let uuid = this.apiService.sendSocketEvent(undefined, account.id, acc.username, 'scan', args, 0);
            let s: Status = {name: acc.username.toLowerCase(), status: 'Sending'};
            this.statusList.set(uuid, s);
          }
        });
      }

      this.isScanning = this.checkScanning();

      // update master page if have data for master
      if (members.length == 1) {
        this.member.updateMember(this.bankerMap);
      }
    }
  }

  checkScanning(): boolean {
    let result: boolean = false;
    this.statusList.forEach((status, key) => {
      if (PROCESSING_STATUS.has(status.status)) {
        result = true;
        return;
      }
    });
    return result;
  }

  getObjectLength(obj) {
    return Object.keys(obj).length;
  }

  removeCustomer(customer: string) {
    console.log()
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.customerList.filter(customer => customer.toLowerCase().indexOf(filterValue) === 0);
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    this.customerChosenList.push(event.option.viewValue);
    this.customerInput.nativeElement.value = '';
    this.customerCtrl.setValue(null);
    this.updateCheckBox();
  }

  add(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;

    if ((value || '').trim()) {
      const idx = this.customerList.indexOf(value.toUpperCase());
      const idx1 = this.customerChosenList.indexOf(value.toUpperCase());
      if (idx >= 0 && idx1 < 0) {
        this.customerChosenList.push(value.toUpperCase().trim());
        this.updateCheckBox();
        // Reset the input value
        if (input) {
          input.value = '';
        }
        this.customerCtrl.setValue(null);
      }
    }
  }

  remove(customer: string): void {
    const index = this.customerChosenList.indexOf(customer);
    if (index >= 0) {
      this.customerChosenList.splice(index, 1);
    }
    this.updateCheckBox();
  }

  updateCheckBox() {
    this.bankerMap.forEach((banker, bankerId) => {
      banker.child.forEach((sup, supId) => {          
        sup.isChecked = false;
      })
      banker.isChecked = false;
    })
    this.customerChosenList.forEach(cusName => {
      this.bankerMap.forEach((banker, bankerId) => {
        banker.child.forEach((sup, supId) => {          
          if (sup.customers.has(cusName)) {
            sup.isChecked = true;
          }
        })
      })
    })
    this.isCheckAll = false;
  }
}