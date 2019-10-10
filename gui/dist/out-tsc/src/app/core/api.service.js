var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import * as io from 'socket.io-client';
var ApiService = /** @class */ (function () {
    //socket: Socket;
    function ApiService(http) {
        this.http = http;
        this.url = "https://manage.vw3.cc:2083/";
        this.namespace = "accountant";
        this.baseUrl = 'https://manage.vw3.cc/';
        this.loginHeaders = new HttpHeaders({ 'Content-type': 'application/x-www-form-urlencoded' });
        this.requestHeaders = new HttpHeaders();
    }
    ApiService.prototype.login = function (loginPayload) {
        return this.http.post(this.baseUrl + 'oauth2/token', loginPayload, { headers: this.loginHeaders });
    };
    ApiService.prototype.getReport = function (body) {
        var headers = {
            'Authorization': 'Bearer ' + JSON.parse(window.sessionStorage.getItem('token')).access_token,
            'Content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
        };
        return this.http.post(this.baseUrl + 'report_detail/get_report', body, { headers: headers });
    };
    ApiService.prototype.getCyclePage = function (currPage, itemPerPage) {
        var body = new HttpParams()
            .set('currentPage', String(currPage))
            .set('itemPerPage', String(itemPerPage));
        var headers = {
            'Authorization': 'Bearer ' + JSON.parse(window.sessionStorage.getItem('token')).access_token,
            'Content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
        };
        return this.http.post(this.baseUrl + 'report_detail/get_cycle_page', body, { headers: headers });
    };
    ApiService.prototype.initSocket = function () {
        this.socket = io(this.url + '/' + this.namespace, { query: 'refresh_token=' + JSON.parse(window.sessionStorage.getItem('token')).refresh_token });
        this.register_base_event();
        this.socket.connect();
    };
    ApiService.prototype.register_base_event = function () {
        var _this = this;
        this.socket.on('connect', function () {
            _this.connected = true;
            console.log('>>> Connecting success');
        });
        this.socket.on('connect_error', function () {
            console.log('>>> Can not connect to server');
        });
        this.socket.on('disconnect', function () {
            _this.connected = false;
            console.log('>>> Disconnect from server');
        });
        this.socket.on('connect', function (err) {
            console.log('>>> Error response from server: ', err);
        });
        this.socket.on('message', function (message) {
            console.log(message);
        });
    };
    // test for socket
    ApiService.prototype.testSocket = function () {
        console.log("XXX");
        this.socket.emit('init', "message");
    };
    ApiService = __decorate([
        Injectable(),
        __metadata("design:paramtypes", [HttpClient])
    ], ApiService);
    return ApiService;
}());
export { ApiService };
//# sourceMappingURL=api.service.js.map