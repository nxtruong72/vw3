import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import * as io from 'socket.io-client';

@Injectable()
export class ApiService {
  private socket_url = "https://manage.vw3.cc:2083/accountant";
  private socket: any;
  private connected: boolean;

  constructor(private http: HttpClient) {}

  baseUrl: string = 'https://manage.vw3.cc/';
  loginHeaders = new HttpHeaders({'Content-type': 'application/x-www-form-urlencoded'});
  requestHeaders = new HttpHeaders();

  login(loginPayload) {
    return this.http.post(this.baseUrl + 'oauth2/token', loginPayload, {headers: this.loginHeaders});
  }

  getReport(body) {
    const headers = {
      'Authorization': 'Bearer ' + JSON.parse(window.sessionStorage.getItem('token')).access_token,
      'Content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
    }
    return this.http.post(this.baseUrl + 'report_detail/get_report', body, {headers});
  }

  getCyclePage(currPage: number, itemPerPage: number) {
    const body = new HttpParams()
                .set('currentPage', String(currPage))
                .set('itemPerPage', String(itemPerPage));
    
    const headers = {
      'Authorization': 'Bearer ' + JSON.parse(window.sessionStorage.getItem('token')).access_token,
      'Content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
    }
    return this.http.post(this.baseUrl + 'report_detail/get_cycle_page', body, {headers});
  }

  initSocket() {
    this.socket = io(this.socket_url, { query: 'refresh_token=' + JSON.parse(window.sessionStorage.getItem('token')).refresh_token });
    this.register_base_event();
    this.socket.connect();
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
    this.socket.on('connect', (err) => {
      console.log('>>> Error response from server: ', err);
    });
    this.socket.on('message', (message) => {
      console.log(message);
    });
  }

  // test for socket
  testSocket() {
    console.log("XXX");

    this.socket.emit('init', "message");
  }
}
