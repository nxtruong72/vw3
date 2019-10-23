import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { AccountantComponent } from './accountant/accountant.component';
import { ReportComponent } from './report/report.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'accountant', component: AccountantComponent },
  { path: 'report', component: ReportComponent },
  { path : '', component : LoginComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
