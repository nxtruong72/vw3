import { Component } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import { RestService } from './core-module/request.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'gui';
  url = "http://localhost:8080";
  test: Map<string, number> = new Map();

  constructor(private restService: RestService){};

  fileChange(event) {
    let fileList: FileList = event.target.files;
    if(fileList.length > 0) {
        let file: File = fileList[0];
        let formData:FormData = new FormData();

        formData.append('file', file, file.name);
        this.restService.sendPost("file", formData).subscribe(val => {
          Object.keys(val).forEach(key => {
            this.test.set(key, val[key]);
          })
          console.log(val);
        });
        console.log(this.test);
        // // let headers = new Headers();
        // /** In Angular 5, including the header Content-Type can invalidate your request */
        // // headers.append('Content-Type', 'multipart/form-data');
        // // headers.append('Accept', 'application/json');
        // // let options = new RequestOptions({ headers: headers });
        // this.http.post(this.url + "/file", formData).subscribe((val) => {
        //   console.log(val);
        // });
    }
}
}
