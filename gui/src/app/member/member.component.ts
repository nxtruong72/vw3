import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { ApiService } from '../core/api.service';
import { Member } from '../core/member';
import { MatPaginator, MatTableDataSource } from '@angular/material';

export interface PeriodicElement {
  name: string;
  position: number;
  weight: number;
  symbol: string;
}

const ELEMENT_DATA: PeriodicElement[] = [
  {position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H'},
  {position: 2, name: 'Helium', weight: 4.0026, symbol: 'He'},
  {position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li'},
  {position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be'},
  {position: 5, name: 'Boron', weight: 10.811, symbol: 'B'},
  {position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C'},
  {position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N'},
  {position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O'},
  {position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F'},
  {position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne'},
];

@Component({
  selector: 'app-member',
  templateUrl: './member.component.html',
  styleUrls: ['./member.component.scss']
})
export class MemberComponent implements OnInit {
  memberTableDisplay: string[] = ['position', 'name', 'username', 'status'];
  memberList: MatTableDataSource<Member>;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  displayedColumns: string[] = ['position', 'name', 'weight', 'symbol'];
  dataSource = ELEMENT_DATA;

  constructor(private apiservice: ApiService) { }

  ngOnInit() {
    this.apiservice.getMemberList().subscribe(response => {
      let data = JSON.parse(JSON.stringify(response)).res.data;
      let tmp: Member[] = [];
      data.List.forEach(element => {
        tmp.push(new Member(element));
      });
      this.memberList = new MatTableDataSource<Member>(tmp);
      this.memberList.paginator = this.paginator;
    })
  }

  applyFilter(filterValue: string) {
    this.memberList.filter = filterValue.trim().toLowerCase();
  }

  memberClick(id: string) {
    console.log(id);
  }
}
