import { Component, OnInit } from '@angular/core';
import { ApiService } from '../core/api.service';
import { Banker } from '../core/banker';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss']
})
export class ReportComponent implements OnInit {
  private bankerMap: Map<String, Banker>;

  constructor(private apiService: ApiService) { }

  ngOnInit() {
    this.bankerMap = this.apiService.sharedData;
  }
}
