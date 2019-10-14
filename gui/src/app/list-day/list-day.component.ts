import { Component, OnInit , Inject} from '@angular/core';
import {Router} from "@angular/router";
import {ApiService} from "../core/api.service";
import { HttpParams } from '@angular/common/http';
import { element } from '@angular/core/src/render3';

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
  selector: 'app-list-user',
  templateUrl: './list-day.component.html',
  styleUrls: ['./list-day.component.css']
})

export class ListUserComponent implements OnInit {
  constructor(private router: Router, private apiService: ApiService) { }

  myDay: MyDayList[] = [];
  myData: MyData[] = [];

  ngOnInit() {
    if(!window.sessionStorage.getItem('token')) {
      this.router.navigate(['login']);
      return;
    }
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
    // this.apiService.testSocket();
    this.apiService.initSocket();
  }
}
