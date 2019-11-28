import { Injectable, Component } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import * as io from 'socket.io-client';
import { v4 as uuid } from 'uuid';
import { Router } from '@angular/router';
import {Subject, Subscription, interval} from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

const MAX_REQUEST = 72;
const PROCESSING_STATUS: Set<string> = new Set(["Sending", "Check session", "Logging", "Getting Data"]);

interface Status {
  id: string,
  uuid: string,
  name: string,
  status: string,
  args: any,
  time: number,
  restartCounter: number
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl: string = 'https://manage.vw3.cc/';
  private socket_url = "https://manage.vw3.cc:2083/accountant";
  private socket: any;
  private token = JSON.parse(window.sessionStorage.getItem('token'));
  private headers: HttpHeaders = new HttpHeaders({
    'Authorization': 'Bearer ' + (this.token ? this.token.access_token : ''),
    'Content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
  });

  // scanning status
  private scanningList: Map<string, Status> = new Map();
  
  receiveMsgEvent = new Subject();

  // Using for report component
  reportMsgEvent = new Subject();
  reportUUIDs: Set<string> = new Set();

  // check status job
  private subscription: Subscription;
  private checkStatusJob = interval(10000);

  private requestBuffer: Status[] = [];

  constructor(private snackBar: MatSnackBar, private router: Router, private http: HttpClient) {
    this.subscription = this.checkStatusJob.subscribe(val => {
      let stopIDs: Set<string> = new Set();
      let now = Date.now() / 1000;
      let counter = 0;
      let currentProcessing = this.countProcessing();

      // Check to restart the request if it's hang
      this.scanningList.forEach((status, uuid) => {
        let waitingTime = (status.restartCounter + 1) * 30;
        if (PROCESSING_STATUS.has(status.status) && now > status.time + waitingTime) {
          // Cause many request have the same id, so just call stopping 1 time
          if (!stopIDs.has(status.id)) {
            this.stop(status);
            stopIDs.add(status.id);
          }
          status.restartCounter++;
          this.requestBuffer.push(status);
          this.scanningList.delete(uuid);
          counter++;
          console.log('Restarting ' + status.name + ' for waiting more than ' + waitingTime + ' seconds...');
        }
      });

      // Check buffer
      while (currentProcessing < MAX_REQUEST && this.requestBuffer.length > 0) {
        let status = this.requestBuffer.shift();
        this.sendSocketEvent(status.uuid, status.id, status.name, 'scan', status.args, status.restartCounter);
        currentProcessing++;
      }

      if (counter > 0 || this.requestBuffer.length > 0) {
        console.log('Restarted ' + counter + ' of ' + this.scanningList.size + ' - Buffer length: ' + this.requestBuffer.length);
      }
    })
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
    this.socket.on('connect', () => { console.log('>>> Connecting success'); });
    this.socket.on('connect_error', () => {
      console.log('>>> Can not connect to server');
      this.receiveMsgEvent.next({___ConnectError: true});
    });
    this.socket.on('disconnect', () => { console.log('>>> Disconnect from server'); });
    this.socket.on('error', (err) => { console.log('>>> Error response from server: ', err); });
    this.socket.on('message', (msg) => {
      let json = JSON.parse(JSON.stringify(msg));
      if (json.___Bind) {
        this.receiveMsgEvent.next(json);
        if (this.scanningList.has(json.uuid) 
          && (json.type == 'resolve' || (json.type == 'reject' && json.data.message != 'Stopped') )) {
            this.scanningList.delete(json.uuid);
        }
      }
    });
    this.socket.once('ready', () => {
      this.sendInitEvent();
    });
  }

  sendInitEvent() {
    let args = [{username: window.sessionStorage.getItem('username').toLowerCase()}];
    let newUuid = uuid();
    this.socket.send({___Send: true, event: 'init', uuid: newUuid, args: args});
  }

  sendSocketEvent(myUuid, id, name, event, args, restartCounter): string {
    let newUUID = (myUuid ? myUuid : uuid());
    let status: Status = { id: id, uuid: newUUID, name: name, args: args, status: 'Sending', time: this.getTimeNow(), restartCounter: restartCounter }
    if (this.countProcessing() < MAX_REQUEST) {
      this.socket.send({___Send: true, event: event, uuid: newUUID, args: args});
      this.scanningList.set(newUUID, status);
    } else {
      this.requestBuffer.push(status);
    }
    return newUUID;
  }

  stopAll() {
    this.scanningList.forEach((args, uuid) => {
      console.log('stopping... ' + uuid);
      this.socket.send({___Send: true, event: 'stop', uuid: uuid, args: args});
    });
  }
  
  stop(status: Status) {
    this.socket.send({___Send: true, event: 'stop', uuid: status.uuid, args: status.args});
  }

  getAllMember() {
    return this.http.post(this.baseUrl + 'member', null, {headers: this.headers});
  }
  
  getMemberDetail(id) {
    const body = new HttpParams().set('memberId', id);
    return this.http.post(this.baseUrl + 'member/get_link_formula_detail', body, {headers: this.headers});
  }

  countProcessing(): number {
    let counter = 0;
    this.scanningList.forEach((status, uuid) => {
      if (PROCESSING_STATUS.has(status.status)) {
        counter++;
      }
    });
    return counter;
  }

  getTimeNow(): number {
    return Date.now() / 1000;
  }

  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getMemberList() {
    return this.http.post(this.baseUrl + 'account', null, {headers: this.headers});
    // return this.http.get('http://localhost:8080/file/account');
  }

  getCurrency() {
    return this.http.get("https://api.exchangerate-api.com/v4/latest/USD");
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