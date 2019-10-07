import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import {Observable} from "rxjs/index";
import { Socket } from 'ngx-socket-io';

@Injectable()
export class ApiService {

  constructor(private http: HttpClient, private socket: Socket) { }

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

  // test for socket
  getDocument(id: string) {
    this.socket.emit('getDoc', id);
  }
}
