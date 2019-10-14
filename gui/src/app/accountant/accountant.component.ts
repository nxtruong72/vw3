import { Component, OnInit , Inject} from '@angular/core';
import {Router} from "@angular/router";
import {ApiService} from "../core/api.service";
import { HttpParams } from '@angular/common/http';
import { Banker } from '../core/banker';
import { Accountant } from '../core/accountant';
import { Account } from '../core/account';

interface MyDayList {
  name: string;
  id: string;
}

interface MyData {
  id: string;
  name: string;
  totalInVND: string;
  totalInUSD: string;
}

@Component({
  selector: 'accountant',
  templateUrl: './accountant.component.html',
  styleUrls: ['./accountant.component.css']
})

export class AccountantComponent implements OnInit {
  constructor(private router: Router, private apiService: ApiService) { }

  private bankerMap: Map<string, Banker> = new Map<string, Banker>();

  myDay: MyDayList[] = [];
  myData: MyData[] = [];

  ngOnInit() {
    // if(!window.sessionStorage.getItem('token')) {
    //   this.router.navigate(['login']);
    //   return;
    // }
    this.myDay = [];
    this.myData = [];
    // this.apiService.getCyclePage(1, 10).subscribe(response => {
    //   let data = JSON.parse(JSON.stringify(response)).res.data;
    //   Object.keys(data).forEach(element => {
    //     let tmp: MyDayList = {id : data[element].id, name: data[element].name};
    //     this.myDay.push(tmp);
    //   });
    // }, error => {
    //   alert(error.error.error_description);
    // })
  }

  dayClick(id: string): void {
    const body = new HttpParams({})
      .set('chuky_id', id);
    
    this.myData = [];
    this.apiService.getReport(body.toString()).subscribe(response => {
      let data = JSON.parse(JSON.stringify(response)).res.data;
      let money : string[] = [];
      Object.keys(data).forEach(element => {
        Object.keys(data[element].total).forEach(total => {
          money = [];
          money.push(data[element].total[total].result);
        });
        let value : MyData = {id: data[element].id, name: data[element].name, totalInUSD: money[0], totalInVND: money[1]?money[1]:'0'};
        this.myData.push(value);
      });
    }, error => {
      console.log(error.error.error_description);
    });
  }

  onClickMe(): void {
    // this.apiService.initSocket();

    // Get banker and accountant info
    this.apiService.getInitData().subscribe(response => {
      let bankerMap = JSON.parse(JSON.stringify(response)).data.bankerMap;
      let scanAccMap = JSON.parse(JSON.stringify(response)).data.scanAccMap;
      Object.keys(bankerMap).forEach(bankerId => {
        let banker = new Banker();
        banker.id = bankerId;
        banker.name = bankerMap[bankerId].name;
        this.bankerMap.set(bankerId, banker);
      })
      Object.keys(scanAccMap).forEach(accountId => {
        let bankerId = scanAccMap[accountId].banker;
        let banker = this.bankerMap.get(bankerId);
        let account: Accountant = new Accountant();
        account.id = accountId;
        account.name = scanAccMap[accountId].acc_name;
        account.note = scanAccMap[accountId].note;
        banker.children.push(account);
        this.bankerMap.set(bankerId, banker);
      });

      // get account info
      this.apiService.getDetailData().subscribe(response => {
        let data = JSON.parse(JSON.stringify(response)).data;
        let accId = data.id;
        let accountant: Accountant;
        let banker: Banker;
        let account: Account;

        console.log(accId);
        this.bankerMap.forEach((value: Banker, key: string) => {
          let account = value.children.find(child => child.id == accId);
          let accountIndex: number;

          if (account != undefined) {
            accountIndex = value.children.indexOf(account);

            console.log(value.name + ' ' + accountIndex);
          }
          // if (value.name == '332bet')
          //   console.log(value.children);
        });
        //account.accountantId = accId;
      })
    });    
  }
}
