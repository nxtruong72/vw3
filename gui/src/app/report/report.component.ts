import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { Banker } from '../core/banker';
import { ApiService } from '../core/api.service';
import { Accountant } from '../core/accountant';
import { MatTableDataSource, MatPaginator } from '@angular/material';
import { FormControl } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MemberFetcher } from '../core/scanning.util';
import { Subject } from 'rxjs';

interface MemberColumn {
  name: string,
  type: string,
  winLoss: number,
  turnover: number
}

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss'],
  // encapsulation:ViewEncapsulation.None
})
export class ReportComponent implements OnInit {
  private superTableHeader = ['position', 'acc_name', 'banker'];
  private superDisplay: any[] = [
    { display: 'No.', id: 'position' },
    { display: 'Name', id: 'acc_name' },
    { display: 'Company', id: 'banker' }
  ];
  private memberTableHeader = ['position', 'name', 'type', 'winLoss', 'turnover'];
  private memberDisplay: any[] = [
    { display: 'No.', id: 'position' },
    { display: 'Name', id: 'name' },
    { display: 'Type', id: 'type' },
    { display: 'Win loss', id: 'winLoss' },
    { display: 'Turn over', id: 'turnover' }
  ];

  private memberLabel: string = 'Member data';

  private superList: MatTableDataSource<Accountant>;
  private memberData: MatTableDataSource<MemberColumn> = new MatTableDataSource();
  private spanCache = [];

  // member table filter
  private inputValue = '';
  private cbPositive = true;
  private cbNegative = true;

  // for Customer
  private customerList: MatTableDataSource<Accountant>;

  // @ViewChildren(MatPaginator) paginator: QueryList<MatPaginator>;
  @ViewChild('supperPaginator', { read: MatPaginator }) supperPaginator: MatPaginator;
  @ViewChild('customerPaginator', { read: MatPaginator }) customerPaginator: MatPaginator;
  @ViewChild('memberPaginator', { read: MatPaginator }) memberPaginator: MatPaginator;
  @Input() bankerMap: Map<string, Banker> = new Map();

  constructor() { }

  ngOnInit() {}

  applySupervisorFilter(filterValue: string) {
    this.superList.filter = filterValue.trim().toLowerCase();
  }

  applyCustomerFilter(filterValue: string) {
    this.customerList.filter = filterValue.trim().toLowerCase();
  }

  applyMemberFilter(filterValue: string) {
    this.inputValue = filterValue.trim().toLowerCase();
    this.memberData.filter = JSON.stringify(this.inputValue);
  }

  updateFilterPredicate() {
    this.memberData.filterPredicate = (data: MemberColumn, filterValue: string) => {
      let searchStr = this.inputValue;
      if ((this.cbPositive && data.winLoss >= 0) || (this.cbNegative && data.winLoss < 0)) {
        return !searchStr || data.name.trim().toLowerCase().indexOf(searchStr) != -1
            || data.type.trim().toLowerCase().indexOf(searchStr) != -1;
      }
      return false;
    }
    this.memberData.filter = JSON.stringify(this.inputValue);
  }

  updateTable() {
    let accAll: Accountant = new Accountant(undefined);
    let bankerAll: Banker = new Banker(undefined);
    let supers: Accountant[] = [];

    accAll.acc_name = 'All';
    accAll.banker = 'XXX';
    supers.push(accAll);

    bankerAll.name = '7$'; bankerAll.child = new Map();
    this.bankerMap.set('XXX', bankerAll);
    this.bankerMap.forEach((banker, bankerId) => {
      banker.child.forEach((sup, id) => {
        supers.push(sup);
      })
    });
    this.superList = new MatTableDataSource(supers);
    this.superList.paginator = this.supperPaginator;
  }

  onClickSuper(account: Accountant) {
    let memberData: MemberColumn[] = [];
    if (account.acc_name == 'All') {
      this.bankerMap.forEach((banker, id) => {
        banker.child.forEach((sup, id) => {
          memberData = memberData.concat(this.getMembers(sup));
        })
      })
    } else {
      let banker = this.bankerMap.get(account.banker);
      memberData = memberData.concat(this.getMembers(banker.child.get(account.id)));
    }
    this.memberData = new MatTableDataSource(memberData);
    this.memberData.paginator = this.memberPaginator;
    this.updateSpanCache();
    console.log(memberData);
  }

  getMembers(sup: Accountant): MemberColumn[] {
    let members: MemberColumn[] = [];
    sup.child.forEach(master => {
      master.child.forEach(agent => {
        agent.child.forEach(member => {
          if (member.data) {
            Object.keys(member.data).forEach(type => {
              let data: MemberColumn = { name: member.username, type: type, turnover: member.data[type].turnover, winLoss: member.data[type].win_loss };
              members.push(data);
            })
          }
        })
      })
    })
    return members;
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
}
