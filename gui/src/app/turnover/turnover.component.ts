import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { Banker } from '../core/banker';
import { MatTableDataSource, MatPaginator } from '@angular/material';

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
  tableDisplay: any[] = [
    // { display: 'Type', id: 'type' },
    { display: 'Company', id: 'company' },
    { display: 'Turn Over', id: 'turnover' },
    { display: 'Active Accounts', id: 'totalAcc' }
  ];
  columnHeaders: string[] = [/*'type',*/ 'company', 'turnover', 'totalAcc'];

  @Input() bankerMap:  Map<string, Banker>;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  private dataSource: MatTableDataSource<TurnOver>;
  private totalTurnover: number;
  private totalAccount: number;
  // using for rowspan
  private spanCache = [];

  constructor() { }

  ngOnInit() {
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
    this.dataSource.paginator = this.paginator;
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
}
