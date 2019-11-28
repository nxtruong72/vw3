import { Component } from '@angular/core';
import { ApiService } from './core/api.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {  
  // currency
  currency: number = 1;
  lastUpdateCurrency: string = "";
  constructor(private apiService: ApiService) {
    this.apiService.getCurrency().subscribe(response => {
      let json = JSON.parse(JSON.stringify(response));
      let date = new Date(json.time_last_updated * 1000);
      
      this.lastUpdateCurrency = date.toString();
      this.currency = json.rates.VND;
    });
  }
}
