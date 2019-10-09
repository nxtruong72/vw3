import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import {Observable} from "rxjs/index";
import { Socket } from 'ngx-socket-io';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
import * as io from 'socket.io-client';

const config: SocketIoConfig = { url: 'https://manage.vw3.cc:2083/', options: {} };

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private url = "https://manage.vw3.cc:2083/";
  private socket: any;
  //socket: Socket;

  constructor(private http: HttpClient) { 
    
  }

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
    // this.socket = io(this.url, {
    //   query: {
    //     refresh_token: JSON.parse(window.sessionStorage.getItem('token')).refresh_token
    //   }
    // });
    // this.socket = io(this.url);
    this.socket = new Socket(config);
    this.socket.ioSocket.nsp = "/accountant";
  }

  // test for socket
  testSocket() {
    console.log("XXX");
    
    this.socket.emit("message");
  }
}
