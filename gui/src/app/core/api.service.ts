import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import * as io from 'socket.io-client';
import { v4 as uuid } from 'uuid';
import { Router } from '@angular/router';
import {Subject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private socket_url = "https://manage.vw3.cc:2083/accountant";
  private socket: any;
  private connected: boolean;
  private isReady: boolean = false;
  private headers: HttpHeaders;
  receiveMsgEvent = new Subject();

  constructor(private router: Router, private http: HttpClient) {}

  baseUrl: string = 'https://manage.vw3.cc/';
  
  requestHeaders = new HttpHeaders();

  login(loginData) {
    let loginHeaders = new HttpHeaders({'Content-type': 'application/x-www-form-urlencoded'});
    const body = new HttpParams()
      .set('username', loginData.username)
      .set('password', loginData.password)
      .set('client_id', '1')
      .set('client_secret', 'jashdfjkh1#!$%#^2342@#$@35')
      .set('grant_type', 'password');
    
    this.http.post(this.baseUrl + 'oauth2/token', body, {headers: loginHeaders}).subscribe(data => {
      window.sessionStorage.setItem('token', JSON.stringify(data));
      this.headers = new HttpHeaders({
        'Authorization': 'Bearer ' + JSON.parse(window.sessionStorage.getItem('token')).access_token,
        'Content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
      })
      this.checkSecure();
      this.router.navigate(['accountant']);
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
    });
    this.socket.on('disconnect', () => {
      this.connected = false;
      console.log('>>> Disconnect from server');
    });
    this.socket.on('error', (err) => {
      console.log('>>> Error response from server: ', err);
    });
    this.socket.on('message', (msg) => {
      
      if (msg.___Bind && msg.type == "resolve") {
        console.log(msg);
        this.receiveMsgEvent.next(msg);
      }
    });
    this.socket.once('ready', () => {
      console.log("READY!!!");
      this.isReady = true;
      this.sendInitEvent();
    })
  }

  sendInitEvent() {
    let args = [{username: "av5533"}];
    this.socket.send({___Send: true, event: 'init', args: args});
  }

  sendSocketEvent(event, args): string {
    let newUUID = uuid();
    // this.socket.on(newUUID, (type, data) => {
    //   console.log(type);
    //   console.log(data);
    // });
    this.socket.send({___Send: true, event: event, uuid: newUUID, args: args});
    return newUUID;
  }

  getInitData() {
    return this.http.get('http://localhost:8080/file/test');
  }

  getDetailData() {
    return this.http.get('http://localhost:8080/file/detail');
  }
}
