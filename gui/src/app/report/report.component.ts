import { Component, OnInit, Input, ViewChild, ViewChildren, QueryList, ViewEncapsulation } from '@angular/core';
import { Banker } from '../core/banker';
import { ApiService } from '../core/api.service';
import { Accountant } from '../core/accountant';
import { MatTableDataSource, MatPaginator } from '@angular/material';
import { FormControl } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Subscription, interval } from 'rxjs';

interface Status {
  id: string,
  name: string,
  status: string,
  args: any,
  time: number,
  restartCounter: number
}

interface MemberColumn {
  name: string,
  type: string,
  winLoss: number
}

const MAX_REQUEST = 50;
const PROCESSING_STATUS = ["Sending", "Check session", "Logging", "Getting Data"];

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss'],
  // encapsulation:ViewEncapsulation.None
})
export class ReportComponent implements OnInit {
  private superTableHeader = ['position', 'name', 'bankerId'];
  private superDisplay: any[] = [
    { display: 'No.', id: 'position' },
    { display: 'Name', id: 'name' },
    { display: 'Company', id: 'bankerId' }
  ];
  private memberTableHeader = ['position', 'name', 'type', 'winLoss'];
  private memberDisplay: any[] = [
    { display: 'No.', id: 'position' },
    { display: 'Name', id: 'name' },
    { display: 'Type', id: 'type' },
    { display: 'Win loss', id: 'winLoss' }
  ];

  private superList: MatTableDataSource<Accountant>;
  private memberData: MatTableDataSource<MemberColumn> = new MatTableDataSource();
  private datePipe = new DatePipe('en-US');
  private statusList: Map<string, Status> = new Map();
  private spanCache = [];

  private subscription: Subscription;
  private checkStatusJob = interval(10000);
  private requestBuffer = [];

  // member table filter
  private inputValue = '';
  private cbPositive = true;
  private cbNegative = true;

  // @ViewChildren(MatPaginator) paginator: QueryList<MatPaginator>;
  @ViewChild('supperPaginator', { read: MatPaginator }) supperPaginator: MatPaginator;
  @ViewChild('memberPaginator', { read: MatPaginator }) memberPaginator: MatPaginator;
  @Input() bankerMap: Map<string, Banker>;
  @Input() fromDate: FormControl;
  @Input() toDate: FormControl;
  @Input() dateInfo: Map<string, Object>;
  @Input() chosenItem: string;

  constructor(private apiService: ApiService) { }

  ngOnInit() {
    this.apiService.reportMsgEvent.subscribe(message => {
      let jsonString = JSON.parse(JSON.stringify(message));
      switch (jsonString.type) {
        case "reject":
        case "notify": {
          this.changeStatus(jsonString.uuid, jsonString.data);
          break;
        }
        case "resolve": {
          this.parseScanData(message);
          break;
        }
      }
    });

    // this job will validate and re-scan the member when it waited more than 10s
    this.subscription = this.checkStatusJob.subscribe(val => {
      const processingStatus: Set<string> = new Set(PROCESSING_STATUS);
      let stopIDs: Set<string> = new Set();
      let now = Date.now() / 1000;
      let counter = 0;
      let currentProcessing = this.countProcessing();

      // Check to restart the request if it's hang
      this.statusList.forEach((value, key) => {
        let waitingTime = (value.restartCounter+1) * 30;
        if (processingStatus.has(value.status) && now > value.time + waitingTime) {
          // Cause many request have the same id, so just call stopping 1 time
          if (!stopIDs.has(value.id)) {
            this.stopRequest(value);
            stopIDs.add(value.id);
          }
          value.restartCounter++;
          this.requestBuffer.push(value);
          this.statusList.delete(key);
          counter++;
          console.log('Restarting ' + value.name + ' for waiting more than ' + waitingTime + ' seconds...')
        }
      });

      // Check buffer
      while (currentProcessing < MAX_REQUEST && this.requestBuffer.length > 0) {
        let status = this.requestBuffer.shift();
        this.send(status.id, status.name, status.args, status.restartCounter);
        currentProcessing++;
      }

      if (counter > 0 || this.requestBuffer.length > 0) {
        console.log('Restarted ' + counter + ' of ' + this.statusList.size + ' - Buffer length: ' + this.requestBuffer.length);
      }
    });
  }

  countProcessing() {
    const processingStatus: Set<string> = new Set(PROCESSING_STATUS);
    let result = 0;
    this.statusList.forEach(status => {
      if (processingStatus.has(status.status)) {
        result++;
      }
    });
    return result;
  }

  changeStatus(uuid, data) {
    if (this.statusList.has(uuid)) {
      let status = this.statusList.get(uuid);
      if (data.message != undefined) {
        status.status = JSON.parse(JSON.stringify(data)).message;
        status.time = (Date.now() / 1000);
        this.statusList.set(uuid, status);
      }
    }
  }

  /* Decide to keep scanning continous or not base on the child list
      if the child list is larger or equal to 3, it means we have the member data, don't need to keep scanning
   */
  parseScanData(message) {
    let data = JSON.parse(JSON.stringify(message)).data;
    let childList = this.getChildList(message.uuid, data);

    if (!this.statusList.has(message.uuid)) {
      return;
    }

    if (childList.length < 3) {
      this.getChildren(message.uuid, data).forEach(acc => {
        // scan for this element
        let from = this.datePipe.transform(this.fromDate.value, 'MM/dd/yyyy');
        let to = this.datePipe.transform(this.toDate.value, 'MM/dd/yyyy');
        let get_child_list: { [x: string]: any } = {};
        let args = [{
          "id": data.id,
          "from_date": from,
          "to_date": to,
          "more_post": {}
        }];
        let more_post = {
          "login_name": window.sessionStorage.getItem('username'),
          "get_child_list": {}
        };
        get_child_list[acc.name.toLowerCase()] = true;
        childList.forEach(c => {
          get_child_list[c] = true;
        })
        more_post.get_child_list = get_child_list;
        args[0].more_post = more_post;

        if (acc.id && acc.name) {
          this.send(acc.id, acc.name, args, 0);
        }
      });
    } else {
      let members = this.getChildren(message.uuid, data);
      let tmp = (this.memberData ? this.memberData.data : []);
      members.forEach(e => {
        if (e.level >= 3) {
          Object.keys(e.data).forEach(element => {
            let xxx: MemberColumn = {
              name: e.name,
              type: element,
              winLoss: e.data[element].win_loss
            };
            tmp.push(xxx);
          });
        }
      });
      this.memberData = new MatTableDataSource(tmp);
      this.memberData.paginator = this.memberPaginator;
      this.updateFilterPredicate();
      this.updateSpanCache();
    }

    // remove from status list
    if (this.statusList.has(message.uuid)) {
      let name = this.statusList.get(message.uuid).name.toUpperCase();
      this.statusList.forEach((value, key) => {
        if (value.name.toUpperCase() == name) {
          this.statusList.delete(key);
        }
      });
    }
  }

  getChildren(uuid, data): Accountant[] {
    let result: Accountant[] = [];
    let childList: string[] = this.getChildList(uuid, data);
    let index = childList.length - 1;
    data.accountant.forEach(account => {
      if (account.username.toLowerCase() == childList[index].toLowerCase()) {
        let loop = account.child;
        // continue with its child
        while (index > 0) {
          let tmp = loop;
          index--;
          tmp.forEach(e => {
            if (e.username.toLowerCase() == childList[index].toLowerCase()) {
              loop = e.child;
            }
          });
        }
        if (loop) {
          loop.forEach(e => {
            let account: Accountant = new Accountant(data.id, e);
            result.push(account);
          });
        }
      }
    });

    return result;
  }

  getChildList(uuid, data): string[] {
    let childList: string[] = [];

    if (data.more_post.get_child_list) {
      Object.keys(data.more_post.get_child_list).forEach(element => {
        childList.push(element);
      });
    } else {
      if (this.statusList.get(uuid)) {
        childList.push(this.statusList.get(uuid).name);
      }
    }

    return childList;
  }

  applySupervisorFilter(filterValue: string) {
    this.superList.filter = filterValue.trim().toLowerCase();
  }

  applyMemberFilter(filterValue: string) {
    this.inputValue = filterValue.trim().toLowerCase();
    this.memberData.filter = JSON.stringify(this.inputValue);
  }

  updateFilterPredicate() {
    this.memberData.filterPredicate = (data: MemberColumn, filterValue: string) => {
      let searchStr = this.inputValue;
      if ((this.cbPositive && data.winLoss >= 0) || (this.cbNegative && data.winLoss < 0)) {
        let xxx = !searchStr || data.name.indexOf(searchStr) != -1 || data.type.indexOf(searchStr) != -1;
        return !searchStr || data.name.indexOf(searchStr) != -1 || data.type.indexOf(searchStr) != -1;
      }
      return false;
    }
    this.memberData.filter = JSON.stringify(this.inputValue);
  }

  updateTable() {
    let supers: Accountant[] = [];
    this.bankerMap.forEach((value, key) => {
      value.children.forEach((value, key) => {
        supers.push(value);
      })
    });
    this.superList = new MatTableDataSource(supers);
    this.superList.paginator = this.supperPaginator;
  }

  onClickSuper(account: Accountant) {
    this.reset();
    this.sendRequest(account);
  }

  reset() {
    this.apiService.reportUUIDs.clear();
    this.statusList.clear();
    // reset member data source
    this.memberData = new MatTableDataSource();
    this.memberData.paginator = this.memberPaginator;
    this.spanCache = [];
  }

  sendRequest(account: Accountant) {
    let from = this.datePipe.transform(this.fromDate.value, 'MM/dd/yyyy');
    let to = this.datePipe.transform(this.toDate.value, 'MM/dd/yyyy');
    let args = [{
      "id": account.id,
      "from_date": from,
      "to_date": to,
      "more_post": { "login_name": window.sessionStorage.getItem('username') }
    }];
    if (account.id && account.name) {
      this.send(account.id, account.name, args, 0);
    }
  }

  send(id, name, args, restartCounter) {
    let status = { id: id, name: name, status: "Sending", args: args, time: (Date.now() / 1000), restartCounter: restartCounter };

    if (this.countProcessing() < MAX_REQUEST) {
      let uuid = this.apiService.sendSocketEvent('scan', args, true);
      this.statusList.set(uuid, status);
    } else {
      this.requestBuffer.push(status);
    }
  }

  stopRequest(req: Status) {
    let args = [{ "id": req.id }];
    this.apiService.sendSocketEvent('stop', args, true);
  }



  onRadioButtonChange() {
    this.fromDate = new FormControl(new Date(JSON.parse(JSON.stringify(this.dateInfo.get(this.chosenItem))).from_date));
    this.toDate = new FormControl(new Date(JSON.parse(JSON.stringify(this.dateInfo.get(this.chosenItem))).to_date));
  }

  updateSpanCache() {
    let data = this.memberData.data;

    this.spanCache = [];
    for (let i = 0; i < data.length;) {
      let count = 1;
      for (let j = i + 1; j < data.length; j++) {
        if (data[j].name != data[i].name) {
          break;
        }
        count++;
      }
      this.spanCache[i] = count;
      i += count;
    }
  }

  getRowSpan(column, index) {
    // only apply span for column name
    if (column == 'name') {
      return this.spanCache[index];
    }
    return 1;
  }

  onClickScan() {
    this.reset();
    this.superList.data.forEach(s => {
      this.sendRequest(s);
    })
  }
}
