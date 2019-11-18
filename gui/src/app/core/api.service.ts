import { Injectable, Component } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import * as io from 'socket.io-client';
import { v4 as uuid } from 'uuid';
import { Router } from '@angular/router';
import {Subject} from 'rxjs';
import { Banker } from './banker';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private socket_url = "https://manage.vw3.cc:2083/accountant";
  private socket: any;
  private connected: boolean;
  private isReady: boolean = false;
  private token = JSON.parse(window.sessionStorage.getItem('token'));
  private headers: HttpHeaders = new HttpHeaders({
    'Authorization': 'Bearer ' + (this.token ? this.token.access_token : ''),
    'Content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
  });
  
  receiveMsgEvent = new Subject();

  // Using for report component
  reportMsgEvent = new Subject();
  reportUUIDs: Set<string> = new Set();

  constructor(private snackBar: MatSnackBar, private router: Router, private http: HttpClient) {}

  baseUrl: string = 'https://manage.vw3.cc/';
  
  requestHeaders = new HttpHeaders();

  sendPost() {

  }

  login(loginData) {
    let loginHeaders = new HttpHeaders({'Content-type': 'application/x-www-form-urlencoded'});
    const body = new HttpParams()
      .set('username', loginData.username)
      .set('password', loginData.password)
      .set('client_id', '1')
      .set('client_secret', 'jashdfjkh1#!$%#^2342@#$@35')
      .set('grant_type', 'password');
    window.sessionStorage.setItem('username', loginData.username);
    this.http.post(this.baseUrl + 'oauth2/token', body, {headers: loginHeaders}).subscribe(data => {
      window.sessionStorage.setItem('token', JSON.stringify(data));
      this.headers = new HttpHeaders({
        'Authorization': 'Bearer ' + JSON.parse(window.sessionStorage.getItem('token')).access_token,
        'Content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
      })
      this.checkSecure();
    }, error => {
        alert(error.error.error_description);
    });
  }

  checkSecure() {
    const body = new HttpParams({})
      .set('code', 'vi');
    this.http.post(this.baseUrl + 'language/get', body, {headers: this.headers})
        .subscribe(data => {
          let isCheckSecure = JSON.parse(JSON.stringify(data)).res.data.userInfo.isCheckSecure;
          if (!isCheckSecure) {
            this.applySecureCode();
          } else {
            console.log("Don't need to check secure");
            this.router.navigate(['accountant']);
          }
        }, error => alert(error.error.error_description));
  }

  applySecureCode() {
    let secureCode = ['-1', '6', '8', '6', '8', '6', '8'];
    this.http.post(this.baseUrl + 'secure/get', null, {headers: this.headers})
        .subscribe(response => {
          let json = JSON.parse(JSON.stringify(response));
          let code1 = json.res.data.code1;
          let code2 = json.res.data.code2;
          const body = new HttpParams({}).set('value1', secureCode[code1]).set('value2', secureCode[code2]);
          this.http.post(this.baseUrl + 'secure/check', body, {headers: this.headers})
              .subscribe(response => {
                console.log("Check secure response: " + JSON.parse(JSON.stringify(response)));
                this.router.navigate(['accountant']);
              }, error => alert(error.error.error_description));
        }, error => alert(error.error.error_description));
  }

  initSocket() {
    this.socket = io(this.socket_url, { query: 'refresh_token=' + JSON.parse(window.sessionStorage.getItem('token')).refresh_token });
    this.register_base_event();
    this.socket.connect();
    // this.socket.emit('init', 'AV5533');
  }

  register_base_event() {
    this.socket.on('connect', () => {
      this.connected = true;
      console.log('>>> Connecting success');
    });
    this.socket.on('connect_error', () => {
      console.log('>>> Can not connect to server');
      this.receiveMsgEvent.next({___ConnectError: true});
    });
    this.socket.on('disconnect', () => {
      this.connected = false;
      console.log('>>> Disconnect from server');
    });
    this.socket.on('error', (err) => {
      console.log('>>> Error response from server: ', err);
    });
    this.socket.on('message', (msg) => {
      if (msg.___Bind) {
        if (this.reportUUIDs.has(msg.uuid)) {
          this.reportMsgEvent.next(msg);
          if (msg.type == 'resolve' || msg.type == 'reject') {
            this.reportUUIDs.delete(msg.uuid);
          }
        } else {
          this.receiveMsgEvent.next(msg);
        }
      }
    });
    this.socket.once('ready', () => {
      console.log("READY!!!");
      this.isReady = true;
      this.sendInitEvent();
    })
  }

  sendInitEvent() {
    let args = [{username: window.sessionStorage.getItem('username')}];
    this.socket.send({___Send: true, event: 'init', args: args});
  }

  sendSocketEvent(event, args, isReportComponent): string {
    let newUUID = uuid();
    this.socket.send({___Send: true, event: event, uuid: newUUID, args: args});
    
    if (isReportComponent == true) {
      this.reportUUIDs.add(newUUID);
    }

    return newUUID;
  }

  getAllMember() {
    return this.http.post(this.baseUrl + 'member', null, {headers: this.headers});
    // return this.http.get('http://localhost:8080/file/member_aLL');
  }
  
  getMemberDetail(id) {
    const body = new HttpParams()
      .set('memberId', id);
    return this.http.post(this.baseUrl + 'member/get_link_formula_detail', body, {headers: this.headers});
    return this.http.get('http://localhost:8080/file/member_r40');
  }

  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getMemberList() {
    return this.http.post(this.baseUrl + 'account', null, {headers: this.headers});
    // return this.http.get('http://localhost:8080/file/account');
  }

  getInitData() {
    return this.http.get('http://localhost:8080/file/test');
  }

  getDetailData() {
    return this.http.get('http://localhost:8080/file/detail');
  }

  getDetailGaData() {
    return this.http.get('http://localhost:8080/file/detail_ga');
  }

  getDetailLotoData() {
    return this.http.get('http://localhost:8080/file/detail_loto');
  }
}