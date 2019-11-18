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
  private superTableHeader = ['position', 'name', 'bankerId'];
  private superDisplay: any[] = [
    { display: 'No.', id: 'position' },
    { display: 'Name', id: 'name' },
    { display: 'Company', id: 'bankerId' }
  ];
  private customerTableHeader = ['position', 'name', 'username'];
  private customerDisplay: any[] = [
    { display: 'No.', id: 'position' },
    { display: 'Name', id: 'name' },
    { display: 'Username', id: 'username' }
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
  private datePipe = new DatePipe('en-US');
  private statusList: Map<string, string> = new Map();
  private spanCache = [];

  // member table filter
  private inputValue = '';
  private cbPositive = true;
  private cbNegative = true;

  private reportMsgEvent = new Subject();

  // for Customer
  private customerList: MatTableDataSource<Accountant>;

  // @ViewChildren(MatPaginator) paginator: QueryList<MatPaginator>;
  @ViewChild('supperPaginator', { read: MatPaginator }) supperPaginator: MatPaginator;
  @ViewChild('customerPaginator', { read: MatPaginator }) customerPaginator: MatPaginator;
  @ViewChild('memberPaginator', { read: MatPaginator }) memberPaginator: MatPaginator;
  @Input() bankerMap: Map<string, Banker>;
  @Input() fromDate: FormControl;
  @Input() toDate: FormControl;
  @Input() dateInfo: Map<string, Object>;
  @Input() chosenItem: string;

  constructor(private apiService: ApiService, private memberFetcher: MemberFetcher) { }

  ngOnInit() {
    this.reportMsgEvent.subscribe(msg => {
      let jsonString = JSON.parse(JSON.stringify(msg));
      if (jsonString.type == "notify") {
        if (jsonString.data.name != "") {
          this.statusList.set(jsonString.data.name.toLowerCase(), jsonString.data.status);
        }
      } else if (jsonString.type == "delete") {
        let name = jsonString.data.name.toLowerCase();
        if (name != "" && this.statusList.has(name)) {
          this.statusList.delete(name);
        }
      } else if (jsonString.type == "resolve") {
        this.parseScanData(jsonString.data);
      }
    });

    // get all customers
    this.apiService.getAllMember().subscribe(response => {
      let data = JSON.parse(JSON.stringify(response)).res.data;
      let cusomterData: Accountant[] = [];
      data.List.forEach(item => {
        let acc: Accountant = new Accountant(item.id, undefined);
        acc.username = item.username;
        acc.name = item.fullname;
        cusomterData.push(acc);
      });
      this.customerList = new MatTableDataSource(cusomterData);
      this.customerList.paginator = this.customerPaginator;
    });
  }

  /* Decide to keep scanning continous or not base on the child list
      if the child list is larger or equal to 3, it means we have the member data, don't need to keep scanning
   */
  parseScanData(message) {
    let data = JSON.parse(JSON.stringify(message)).data;
    let members = this.memberFetcher.getChildren(message.uuid, data);
    let tmp = (this.memberData ? this.memberData.data : []);
    members.forEach(e => {
      if (e.level >= 3) {
        Object.keys(e.data).forEach(element => {
          let xxx: MemberColumn = {
            name: e.name,
            type: element,
            winLoss: e.data[element].win_loss,
            turnover: e.data[element].turnover
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
    let supers: Accountant[] = [];
    this.bankerMap.forEach((value, key) => {
      value.children.forEach((value, key) => {
        supers.push(value);
      })
    });
    this.superList = new MatTableDataSource(supers);
    this.superList.paginator = this.supperPaginator;
  }

  onClickCustomer(account: Accountant) {
    let checker: Set<string> = new Set();
    let superList: Accountant[] = [];
    this.reset();
    this.apiService.getMemberDetail(account.id).subscribe(response => {
      let data = JSON.parse(JSON.stringify(response)).res.data.List;
      data.memberDetail.forEach(member => {
        let banker = this.bankerMap.get(member.banker_id);
        let acc_name = member.acc_name.toLowerCase();
        if (banker) {
          banker.children.forEach((acc, id) => {
            if (acc_name.indexOf(acc.name.toLowerCase()) != -1 && !checker.has(id)) {
              checker.add(id);
              superList.push(acc);
            }
          });
        }
      });
      if (superList.length > 0) {
        let from = this.datePipe.transform(this.fromDate.value, 'MM/dd/yyyy');
        let to = this.datePipe.transform(this.toDate.value, 'MM/dd/yyyy');
        this.memberFetcher.scan(from, to, superList, account.name.toLowerCase(), this.reportMsgEvent);
      }
      console.log(superList);
    });
    this.memberLabel = 'Member data (' + account.name.toUpperCase() + ')';
  }

  onClickSuper(account: Accountant) {
    let from = this.datePipe.transform(this.fromDate.value, 'MM/dd/yyyy');
    let to = this.datePipe.transform(this.toDate.value, 'MM/dd/yyyy');
    let scanedList: Accountant[] = [account];
    this.reset();
    this.memberFetcher.scan(from, to, scanedList, undefined, this.reportMsgEvent);
  }

  onClickScan() {
    let from = this.datePipe.transform(this.fromDate.value, 'MM/dd/yyyy');
    let to = this.datePipe.transform(this.toDate.value, 'MM/dd/yyyy');
    let scanedList: Accountant[] = [];
    this.reset();
    this.superList.data.forEach(s => {
      scanedList.push(s);
    });
    this.memberFetcher.scan(from, to, scanedList, undefined, this.reportMsgEvent);
  }

  reset() {
    this.apiService.reportUUIDs.clear();
    this.statusList.clear();
    // reset member data source
    this.memberData = new MatTableDataSource();
    this.memberData.paginator = this.memberPaginator;
    this.spanCache = [];
    this.memberLabel = 'Member data';
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
}
