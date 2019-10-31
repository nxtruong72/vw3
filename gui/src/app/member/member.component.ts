import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { ApiService } from '../core/api.service';
import { Member } from '../core/member';
import { MatPaginator, MatTableDataSource } from '@angular/material';

@Component({
  selector: 'app-member',
  templateUrl: './member.component.html',
  styleUrls: ['./member.component.scss']
})
export class MemberComponent implements OnInit {
  // memberTableDisplay: any[] = [
  //   { display: 'No.', id: 'position' },
  //   { display: 'NAME', id: 'name' },
  //   { display: 'USERNAME', id: 'subUser' },
  //   { display: 'COMPANY', id: 'bankerName' },
  //   { display: 'ACTIVE', id: 'isActive' }
  // ];
  memberTableDisplay: string[] = ['position', 'name', 'subUser', 'bankerName', 'isActive'];
  memberList: MatTableDataSource<Member>;

  @ViewChild(MatPaginator) paginator: MatPaginator;

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
