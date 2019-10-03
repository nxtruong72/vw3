import { HttpClient } from "@angular/common/http";
import { Injectable } from '@angular/core';

@Injectable()
export class RestService {
    title = 'XXX';
    baseUrl = "http://localhost:8080/";

    constructor(private http:HttpClient){};

    sendPost(url: string, data: any) {
        return this.http.post(this.baseUrl + url, data);
    }
}