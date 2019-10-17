import { Component, OnInit, Inject } from '@angular/core';
import { Router } from "@angular/router";
import { ApiService } from "../core/api.service";
import { Banker } from '../core/banker';
import { Accountant } from '../core/accountant';
import {FormControl} from '@angular/forms';
import { DatePipe } from '@angular/common'

@Component({
  selector: 'accountant',
  templateUrl: './accountant.component.html',
  styleUrls: ['./accountant.component.css']
})

export class AccountantComponent implements OnInit {
  private bankerMap: Map<string, Banker> = new Map<string, Banker>();
  private fromDate = new FormControl();
  private toDate = new FormControl();
  private datePipe = new DatePipe('en-US');

  constructor(private router: Router, private apiService: ApiService) { }

  ngOnInit() {
    // if(!window.sessionStorage.getItem('token')) {
    //   this.router.navigate(['login']);
    //   return;
    // }

    // listen evet from apiservice
    this.apiService.receiveMsgEvent.subscribe(message => {
      console.log("Receive from component:");
      console.log(message);
      this.parseInitData(message);
    })
  }

  onClickScan() {
    let from = this.datePipe.transform(this.fromDate.value, 'MM/dd/yyyy');
    console.log(this.fromDate.value);
    console.log(from);
  }

  onCheckBoxChange(item) {
    console.log(item);
  }

  onClickMe(): void {
    // this.apiService.initSocket();
    this.parseData();
  }

  parseInitData(message) {
    let bankerMap = JSON.parse(JSON.stringify(message)).data.bankerMap;
    let scanAccMap = JSON.parse(JSON.stringify(message)).data.scanAccMap;
    let dateInfo = JSON.parse(JSON.stringify(message)).data.dateInfo;

    // get date info
    this.fromDate = new FormControl(new Date(dateInfo.today.from_date));
    this.toDate = new FormControl(new Date(dateInfo.today.to_date));

    // Get banker info
    Object.keys(bankerMap).forEach(bankerId => {
      let banker = new Banker();
      banker.id = bankerId;
      banker.name = bankerMap[bankerId].name;
      this.bankerMap.set(bankerId, banker);
    })

    // Get accountant info
    Object.keys(scanAccMap).forEach(accountId => {
      let bankerId = scanAccMap[accountId].banker;
      let banker = this.bankerMap.get(bankerId);
      let account: Accountant = new Accountant(accountId, scanAccMap[accountId]);
      banker.children.set(accountId, account);
      this.bankerMap.set(bankerId, banker);
    });
  }

  parseData() {
    this.apiService.getInitData().subscribe(response => {
      let bankerMap = JSON.parse(JSON.stringify(response)).data.bankerMap;
      let scanAccMap = JSON.parse(JSON.stringify(response)).data.scanAccMap;
      let dateInfo = JSON.parse(JSON.stringify(response)).data.dateInfo;

      // get date info
      this.fromDate = new FormControl(new Date(dateInfo.today.from_date));
      this.toDate = new FormControl(new Date(dateInfo.today.to_date));

      // Get banker info
      Object.keys(bankerMap).forEach(bankerId => {
        let banker = new Banker();
        banker.id = bankerId;
        banker.name = bankerMap[bankerId].name;
        this.bankerMap.set(bankerId, banker);
      })

      // Get accountant info
      Object.keys(scanAccMap).forEach(accountId => {
        let bankerId = scanAccMap[accountId].banker;
        let banker = this.bankerMap.get(bankerId);
        let account: Accountant = new Accountant(accountId, scanAccMap[accountId]);
        banker.children.set(accountId, account);
        this.bankerMap.set(bankerId, banker);
      });

      // Get account info
      this.apiService.getDetailData().subscribe(response => {
        let data = JSON.parse(JSON.stringify(response)).data.accountant[0];
        let accId = data.accInfo.id;
        let banker = this.bankerMap.get(data.accInfo.banker);

        console.log(data);
        if (banker != undefined) {
          let account = banker.children.get(accId);

          // update its info
          account.turnOver = data.data.sb.turnover;
          account.gross_common = data.data.sb.gross_comm;

          // update its child
          data.child.forEach(element => {
            let accountant: Accountant = new Accountant(element.username, null);
            accountant.name = element.username;
            accountant.turnOver = element.data.sb.turnover;
            accountant.gross_common = element.data.sb.gross_comm;
            account.children.set(accountant.id, accountant);
          });

          // update back to banker
          banker.children.set(accId, account);

          // update back to bankerMap
          this.bankerMap.set(banker.id, banker);
        }
      })
    });
  }
}
