import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { Banker } from '../core/banker';
import { MatTableDataSource, MatPaginator } from '@angular/material';
import { ApiService } from '../core/api.service';
import { Accountant } from '../core/accountant';

interface TurnOver {
  type: string,
  company: string,
  turnover: number,
  totalAcc: number
}

@Component({
  selector: 'app-turnover',
  templateUrl: './turnover.component.html',
  styleUrls: ['./turnover.component.scss']
})
export class TurnoverComponent implements OnInit {
  private columnHeaders: string[] = [/*'type',*/ 'company', 'turnover', 'totalAcc'];
  private tableDisplay: any[] = [
    // { display: 'Type', id: 'type' },
    { display: 'Company', id: 'company' },
    { display: 'Turn Over', id: 'turnover' },
    { display: 'Active Accounts', id: 'totalAcc' }
  ];
  private customerTableHeader = ['position', 'acc_name', 'username'];
  private customerDisplay: any[] = [
    { display: 'No.', id: 'position' },
    { display: 'Name', id: 'acc_name' },
    { display: 'Username', id: 'username' }
  ];

  @Input() bankerMap:  Map<string, Banker>;
  @ViewChild('customerPaginator', { read: MatPaginator }) customerPaginator: MatPaginator;
  @ViewChild('turnOverTable', { read: MatPaginator }) turnOverPaginator: MatPaginator;

  private dataSource: MatTableDataSource<TurnOver>;
  private totalTurnover: number;
  private totalAccount: number;
  // using for rowspan
  private spanCache = [];

  private customerList: MatTableDataSource<Accountant>;

  constructor(private apiService: ApiService) { }

  ngOnInit() {
    // get all customers
    this.apiService.getAllMember().subscribe(response => {
      let data = JSON.parse(JSON.stringify(response)).res.data;
      let cusomterData: Accountant[] = [];
      data.List.forEach(item => {
        let acc: Accountant = new Accountant(undefined);
        acc.username = item.username;
        acc.acc_name = item.fullname;
        cusomterData.push(acc);
      });
      this.customerList = new MatTableDataSource(cusomterData);
      this.customerList.paginator = this.customerPaginator;
    });
  }

  updateTurnOver() {
    let tmpData: TurnOver[] = [];
    let mappingName = {
      "sb": "SPORTBOOK",
      "csn": "CASINO",
      "cf": "GÀ",
      "loto": "LOTO"
    }
    this.bankerMap.forEach((value, key) => {
      let sum = 0;
      if (value.data) {
        Object.keys(value.data).forEach(type => {
          if (value.data[type].turnover) {
            sum += Number(value.data[type].turnover);
          }
        });
      }
      tmpData.push({ type: "XXX", company: value.name, turnover: sum, totalAcc: value.total_account });
    });
    tmpData = this.sort(tmpData);
    this.dataSource = new MatTableDataSource(tmpData);
    this.dataSource.paginator = this.turnOverPaginator;
    this.updateSpanCached();
  }

  sort(listData: TurnOver[]) {
    let tmpList = listData;
    for (let i = 0; i < tmpList.length; i++) {
      for (let j = i+1; j < tmpList.length; j++) {
        if (tmpList[i].type > tmpList[j].type
            || (tmpList[i].type == tmpList[j].type && tmpList[i].company > tmpList[j].company)) {
                let tmp = tmpList[i];
                tmpList[i] = tmpList[j];
                tmpList[j] = tmp;
              }
      }
    }
    return tmpList;
  }

  updateSpanCached() {
    let data = this.dataSource.data;
    this.spanCache = [];

    for (let i = 0; i < data.length;) {
      let count = 1;
      for (let j = i+1; j <data.length; j++) {
        if (data[j].type != data[i].type) {
          break;
        }
        count++;
      }
      this.spanCache[i] = count;
      i += count;
    }
  }

  getRowSpan(column, index) {
    // only apply span for column type
    // if (column == 'type') {
    //   return this.spanCache[index];
    // }
    return 1;
  }

  onClickCustomer(account: Accountant) {
    this.apiService.getMemberDetail(account.id).subscribe(response => {
      let data = JSON.parse(JSON.stringify(response)).res.data.List;
      data.memberDetail.forEach(member => {
        let banker = this.bankerMap.get(member.banker_id);
        let acc_name = member.acc_name.toLowerCase();
        if (banker) {
          banker.child.forEach()

          banker.child.forEach((acc, id) => {
            if (acc_name.indexOf(acc.username.toLowerCase()) != -1 && !checker.has(id)) {
              checker.add(id);
              superList.push(acc);
            }
          });
        }
      });
      if (superList.length > 0) {
        let from = this.datePipe.transform(this.fromDate.value, 'MM/dd/yyyy');
        let to = this.datePipe.transform(this.toDate.value, 'MM/dd/yyyy');
        this.memberFetcher.scan(from, to, superList, account.username.toLowerCase(), this.reportMsgEvent);
      }
      console.log(superList);
    });
  }
}
