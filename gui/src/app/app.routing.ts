import { RouterModule, Routes } from '@angular/router';
import {LoginComponent} from "./login/login.component";
import { AccountantComponent } from './accountant/accountant.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'accountant', component: AccountantComponent },
  {path : '', component : LoginComponent}
];

export const routing = RouterModule.forRoot(routes);
