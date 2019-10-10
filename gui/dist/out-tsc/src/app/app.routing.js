import { RouterModule } from '@angular/router';
import { LoginComponent } from "./login/login.component";
import { ListUserComponent } from './list-day/list-day.component';
var routes = [
    { path: 'login', component: LoginComponent },
    { path: 'list-day', component: ListUserComponent },
    { path: '', component: LoginComponent }
];
export var routing = RouterModule.forRoot(routes);
//# sourceMappingURL=app.routing.js.map