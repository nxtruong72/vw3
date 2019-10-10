var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component } from '@angular/core';
import { Router } from "@angular/router";
import { ApiService } from "../core/api.service";
import { HttpParams } from '@angular/common/http';
var ListUserComponent = /** @class */ (function () {
    function ListUserComponent(router, apiService) {
        this.router = router;
        this.apiService = apiService;
        this.myDay = [];
        this.myData = [];
    }
    ListUserComponent.prototype.ngOnInit = function () {
        if (!window.sessionStorage.getItem('token')) {
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
        this.apiService.initSocket();
    };
    ListUserComponent.prototype.dayClick = function (id) {
        var _this = this;
        var body = new HttpParams({})
            .set('chuky_id', id);
        this.myData = [];
        this.apiService.getReport(body.toString()).subscribe(function (response) {
            var data = JSON.parse(JSON.stringify(response)).res.data;
            var money = [];
            Object.keys(data).forEach(function (element) {
                Object.keys(data[element].total).forEach(function (total) {
                    money = [];
                    money.push(data[element].total[total].result);
                });
                var value = { id: data[element].id, name: data[element].name, totalInUSD: money[0], totalInVND: money[1] ? money[1] : '0' };
                _this.myData.push(value);
            });
        }, function (error) {
            console.log(error.error.error_description);
        });
    };
    ListUserComponent.prototype.onClickMe = function () {
        this.apiService.testSocket();
    };
    ListUserComponent = __decorate([
        Component({
            selector: 'app-list-user',
            templateUrl: './list-day.component.html',
            styleUrls: ['./list-day.component.css']
        }),
        __metadata("design:paramtypes", [Router, ApiService])
    ], ListUserComponent);
    return ListUserComponent;
}());
export { ListUserComponent };
//# sourceMappingURL=list-day.component.js.map