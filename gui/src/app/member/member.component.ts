import { Component, OnInit, AfterViewInit, ViewChild, Input } from '@angular/core';
import { ApiService } from '../core/api.service';
import { Member } from '../core/member';
import { MatPaginator, MatTableDataSource } from '@angular/material';
import { Banker } from '../core/banker';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-member',
  templateUrl: './member.component.html',
  styleUrls: ['./member.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', display: 'none' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ]
})
export class MemberComponent implements OnInit {
  memberTableDisplay: any[] = [
    { display: 'No.', id: 'position' },
    { display: 'Name', id: 'name' },
    { display: 'Username', id: 'subUser' },
    { display: 'Company', id: 'bankerName' },
    { display: 'Active', id: 'isActive' }
  ];
  // memberTableDisplay: string[] = ['position', 'name', 'subUser', 'bankerName', 'isActive'];
  columnHeaders: string[] = ['position', 'name', 'subUser', 'bankerName', 'isActive'];
  memberList: MatTableDataSource<Member>;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(private apiservice: ApiService) { }

  ngOnInit() {
    this.apiservice.getMemberList().subscribe(response => {
      let data = JSON.parse(JSON.stringify(response)).res.data;
      let tmp: Member[] = [];
      data.List.forEach(element => {
        if (element.child) {
          element.child.forEach(child => {
            tmp.push(new Member(child));
          })
        }
      });
      this.memberList = new MatTableDataSource<Member>(tmp);
      this.memberList.paginator = this.paginator;
    })
  }

  applyFilter(filterValue: string) {
    this.memberList.filter = filterValue.trim().toLowerCase();
  }

  memberClick() {
    // console.log(this.masterList);
  }
}
