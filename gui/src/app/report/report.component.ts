import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { Banker } from '../core/banker';
import { ApiService } from '../core/api.service';
import { Accountant } from '../core/accountant';
import { MatTableDataSource, MatPaginator } from '@angular/material';
import { FormControl } from '@angular/forms';
import { DatePipe } from '@angular/common';

interface Status {
  name: string,
  status: string
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
  private superList: MatTableDataSource<Accountant>;
  private datePipe = new DatePipe('en-US');
  private uuidToAccountant: Map<string, Accountant> = new Map();
  private statusList: Map<string, Status> = new Map();
  private memberList: Accountant[] = [];

  @ViewChild(MatPaginator) paginator: MatPaginator;
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
    let childList: string[] = [];

    if (data.more_post.get_child_list) {
      Object.keys(data.more_post.get_child_list).forEach(element => {
        childList.push(element);
      });
    } else {
      childList.push(this.statusList.get(message.uuid).name);
    }
    console.log(childList);
    if (childList.length < 3) {
      let index = childList.length-1;
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
          console.log(loop);
          if (loop) {
            loop.forEach(e => {
              // scan for this element
              let from = this.datePipe.transform(this.fromDate.value, 'MM/dd/yyyy');
              let to = this.datePipe.transform(this.toDate.value, 'MM/dd/yyyy');
              let tmpMap: Map<string, boolean> = new Map;
              let get_child_list: {[x:string]: any} = {};
              let args = [{
                "id": data.id,
                "from_date": from,
                "to_date": to,
                "more_post": {
                  "login_name": window.sessionStorage.getItem('username'),
                  "get_child_list": {}
                }
              }];
              get_child_list[e.username.toLowerCase()] = true;
              childList.forEach(c => {
                get_child_list[c] = true;
              })
              args[0].more_post.get_child_list = get_child_list;

              let uuid = this.apiService.sendSocketEvent('scan', args, true);
              this.uuidToAccountant.set(uuid, account);
              this.statusList.set(uuid, { name: account.name, status: "Sending"});
            })
          }
        }
      });
    } else {
      this.getMemberData(data);
    }
  }

  getMemberData(data) {

  }

  applyFilter(filterValue: string) {
    this.superList.filter = filterValue.trim().toLowerCase();
  }

  updateTable() {
    let supers: Accountant[] = [];
    this.bankerMap.forEach((value, key) => {
      value.children.forEach((value, key) => {
        supers.push(value);
      })
    });
    this.superList = new MatTableDataSource(supers);
    this.superList.paginator = this.paginator;
  }

  onClickSuper(account: Accountant) {
    console.log(account);
    let from = this.datePipe.transform(this.fromDate.value, 'MM/dd/yyyy');
    let to = this.datePipe.transform(this.toDate.value, 'MM/dd/yyyy');
    this.apiService.reportUUIDs.clear();
    this.statusList.clear();
    this.memberList = [];

    let args = [{
      "id": account.id,
      "from_date": from,
      "to_date": to,
      "more_post": { "login_name": window.sessionStorage.getItem('username') }
    }];
    let uuid = this.apiService.sendSocketEvent('scan', args, true);
    this.statusList.set(uuid, { name: account.name, status: "Sending"});
  }

  onRadioButtonChange() {
    this.fromDate = new FormControl(new Date(JSON.parse(JSON.stringify(this.dateInfo.get(this.chosenItem))).from_date));
    this.toDate = new FormControl(new Date(JSON.parse(JSON.stringify(this.dateInfo.get(this.chosenItem))).to_date));
  }

  onClickScan() {
    
  }
}
