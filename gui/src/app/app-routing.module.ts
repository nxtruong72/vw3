import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { AccountantComponent } from './accountant/accountant.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'accountant', component: AccountantComponent },
  { path : '', component : LoginComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
