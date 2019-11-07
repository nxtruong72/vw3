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
    { display: 'TYPE', id: 'type' },
    { display: 'COMPANY', id: 'company' },
    { display: 'TURNOVER', id: 'turnover' },
    { display: 'ACTIVE ACCOUNTS', id: 'totalAcc' }
  ];
  columnHeaders: string[] = ['type', 'company', 'turnover', 'totalAcc'];

  @Input() bankerMap:  Map<string, Banker>;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  private dataSource: MatTableDataSource<TurnOver>;
  private totalTurnover: number;
  private totalAccount: number;

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
      let hasData: boolean = false;
      if (value.data) {
        Object.keys(value.data).forEach(e => {
          if (mappingName[e]) {
            tmpData.push({ type: mappingName[e], company: value.name, turnover: value.data[e].turnover, totalAcc: value.total_account });
            this.totalTurnover += Number(value.data[e].turnover);
            hasData = true;
          }
        });
      }
      if (hasData) {
        this.totalAccount += value.total_account;
      }
    });
    this.dataSource = new MatTableDataSource(tmpData);
    this.dataSource.paginator = this.paginator;
    console.log(tmpData);
  }
}
