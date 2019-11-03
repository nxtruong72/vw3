import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { Banker } from '../core/banker';
import { ApiService } from '../core/api.service';
import { Accountant } from '../core/accountant';
import { MatTableDataSource, MatPaginator } from '@angular/material';

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

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @Input() bankerMap: Map<string, Banker>;

  constructor(private apiservice: ApiService) { }

  ngOnInit() {}

  applyFilter(filterValue: string) {
    this.superList.filter = filterValue.trim().toLowerCase();
  }

  updateTable() {
    console.log('XXX');
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
  }
}
