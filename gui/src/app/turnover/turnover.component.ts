import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { Banker } from '../core/banker';
import { MatTableDataSource, MatPaginator } from '@angular/material';
import { ApiService } from '../core/api.service';
import { Accountant } from '../core/accountant';

interface TurnOver {
  type: string,
  company: string,
  turnover: number,
  totalMaster: number,
  totalMember: number
}

@Component({
  selector: 'app-turnover',
  templateUrl: './turnover.component.html',
  styleUrls: ['./turnover.component.scss']
})
export class TurnoverComponent implements OnInit {
  private columnHeaders: string[] = [/*'type',*/ 'company', 'turnover', 'totalMaster', 'totalMember'];
  private tableDisplay: any[] = [
    // { display: 'Type', id: 'type' },
    { display: 'Company', id: 'company' },
    { display: 'Turn Over', id: 'turnover' },
    { display: 'Master', id: 'totalMaster' },
    { display: 'Member', id: 'totalMember' }
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

  private customerList: MatTableDataSource<Accountant>;
  private dataSource: MatTableDataSource<TurnOver>;
  private totalTurnover: number;
  private totalAccount: number;
  // using for rowspan
  private spanCache = [];
  // currency
  private currency: number = 1;

  constructor(private apiService: ApiService) { }

  ngOnInit() {
    // get all customers
    this.apiService.getAllMember().subscribe(response => {
      let data = JSON.parse(JSON.stringify(response)).res.data;
      let cusomterData: Accountant[] = [];
      data.List.forEach(item => {
        let acc: Accountant = new Accountant(undefined);
        acc.username = item.username.toUpperCase();
        acc.acc_name = item.fullname.toUpperCase();
        acc.id = item.id;
        cusomterData.push(acc);
      });
      this.customerList = new MatTableDataSource(cusomterData);
      this.customerList.paginator = this.customerPaginator;
    });
    this.apiService.getCurrency().subscribe(response => {
      let json = JSON.parse(JSON.stringify(response));
      this.currency = json.rates.VND;
    });
  }

  updateTurnOver() {
    // let tmpData: TurnOver[] = [];
    // let mappingName = {
    //   "sb": "SPORTBOOK",
    //   "csn": "CASINO",
    //   "cf": "GÀ",
    //   "loto": "LOTO"
    // }
    // this.bankerMap.forEach((banker, bankerId) => {
    //   let sum = 0;
    //   let totalMember = 0;
    //   if (banker.data) {
    //     Object.keys(banker.data).forEach(type => {
    //       if (banker.data[type].turnover) {
    //         sum += Number(banker.data[type].turnover);
    //       }
    //     });
    //     banker.child.forEach((sup, supId) => {
    //       sup.child.forEach(master => {
    //         master.child.forEach(agent => {
    //           totalMember += agent.child.length;
    //         })
    //       })
    //     })
    //   }
    //   if (banker.name != '7$') {
    //     tmpData.push({ type: "XXX", company: banker.name, turnover: sum, totalMaster: banker.total_account, totalMember: totalMember });
    //   }
    // });
    // tmpData = this.sort(tmpData);
    // this.dataSource = new MatTableDataSource(tmpData);
    // this.dataSource.paginator = this.turnOverPaginator;
    // this.updateSpanCached();
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
    let tmpData: TurnOver[] = [];
    let customerName = account.acc_name;
    let superList: string[] = [];
    this.bankerMap.forEach((banker, bankerId) => {
      let sum = 0;
      let totalMember = 0;
      banker.child.forEach((sup, supId) => {
        if (sup.customers.has(customerName)) {
          superList.push(sup.acc_name);
          sup.child.forEach(master => {
            if (master.reportAccountant && master.reportAccountant.length > 0) {
              master.reportAccountant.forEach(report => {
                let ok = false;
                report.resultList.forEach(result => {
                  if (result.memberName.toUpperCase() == customerName) {
                    ok = true;
                  }
                })
                if (report.resultList.length == 0 || ok) {
                  if (banker.name.toLowerCase() === 'ld789' || report.reportType.toLowerCase() === 'loto') {
                    let tmp = (Number(report.reportData.turnover));
                    tmp = ((tmp/1000) / this.currency);
                    sum += tmp;
                  } else {
                    sum += Number(report.reportData.turnover);
                  }
                }
              })
            }
            master.child.forEach(agent => {
              totalMember += agent.child.length;
            })
          })
        }
      })
      console.log(banker.name + ' -> ' + sum);
      if (banker.name != '7$') {
        tmpData.push({ type: "XXX", company: banker.name, turnover: Math.round(sum), totalMaster: banker.total_account, totalMember: totalMember });
      }
    })
    tmpData = this.sort(tmpData);
    this.dataSource = new MatTableDataSource(tmpData);
    this.dataSource.paginator = this.turnOverPaginator;
    this.updateSpanCached();
    console.log(superList);
  }

  applyCustomerFilter(filterValue: string) {
    this.customerList.filter = filterValue.trim().toLowerCase();
  }
}
