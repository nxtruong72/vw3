import { Component, OnInit, Input, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { Banker } from '../core/banker';
import { ApiService } from '../core/api.service';
import { Accountant } from '../core/accountant';
import { MatTableDataSource, MatPaginator } from '@angular/material';
import { FormControl } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { async } from 'q';
import { Subscription, interval } from 'rxjs';

interface Status {
  name: string,
  status: string,
  args: any,
  time: number
}

interface MemberColumn {
  name: string,
  type: string,
  winLoss: number
}

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss']
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
  private uuidToAccountant: Map<string, Accountant> = new Map();
  private statusList: Map<string, Status> = new Map();
  private memberList: Accountant[] = [];

  private subscription: Subscription;
  private checkStatusJob = interval(10000);

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
      let now = Date.now() / 1000;
      this.statusList.forEach((value, key) => {
        if (value.status != 'Empty data' && now > value.time+30) {
          console.log('Restarting ' + value.name) + '...';
          let uuid = this.send(value.args);
          this.statusList.set(uuid, { name: value.name, status: "Sending", args: value.args, time: (Date.now()/1000) });
          this.statusList.delete(key);
        }
      })
    });
  }

  changeStatus(uuid, data) {
    if (this.statusList.has(uuid)) {
      let status = this.statusList.get(uuid);
      if (data.message != undefined) {
        status.status = JSON.parse(JSON.stringify(data)).message;
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
      let accounts: Accountant[] = this.getChildren(message.uuid, data);

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

          let uuid = this.send(args);
          this.statusList.set(uuid, { name: acc.name, status: "Sending", args: args, time: (Date.now()/1000) });
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
      console.log(this.memberData.data);
    }

    // remove from status list
    if (this.statusList.has(message.uuid)) {
      this.statusList.delete(message.uuid);
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
            let account: Accountant = new Accountant("XXX", e);
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
      childList.push(this.statusList.get(uuid).name);
    }

    return childList;
  }

  applyFilter(filterValue: string) {
    this.superList.filter = filterValue.trim().toLowerCase();
  }

  applyMemberFilter(filterValue: string) {
    // apply filter for winLoss only
    this.memberData.filterPredicate = (data: MemberColumn, filterValue: string) => {
      return data.winLoss > parseInt(filterValue);
    }
    this.memberData.filter = filterValue.trim().toLowerCase();
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
    console.log(account);
    let from = this.datePipe.transform(this.fromDate.value, 'MM/dd/yyyy');
    let to = this.datePipe.transform(this.toDate.value, 'MM/dd/yyyy');
    this.apiService.reportUUIDs.clear();
    this.statusList.clear();
    this.memberList = [];
    // reset member data source
    this.memberData = new MatTableDataSource();
    this.memberData.paginator = this.memberPaginator;

    let args = [{
      "id": account.id,
      "from_date": from,
      "to_date": to,
      "more_post": { "login_name": window.sessionStorage.getItem('username') }
    }];
    let uuid = this.send(args);
    this.statusList.set(uuid, { name: account.name, status: "Sending", args: args, time: (Date.now()/1000) });
  }

  send(args) {
    let uuid = this.apiService.sendSocketEvent('scan', args, true);
    return uuid;
  }

  onRadioButtonChange() {
    this.fromDate = new FormControl(new Date(JSON.parse(JSON.stringify(this.dateInfo.get(this.chosenItem))).from_date));
    this.toDate = new FormControl(new Date(JSON.parse(JSON.stringify(this.dateInfo.get(this.chosenItem))).to_date));
  }

  onClickScan() {

  }
}
