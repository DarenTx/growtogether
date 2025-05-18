import { Routes } from '@angular/router';
import { DataEntryComponent } from './data-entry/data-entry.component';
import { MagicLinkLoginComponent } from './magic-link-login/magic-link-login.component';
import { authGuard } from './services/auth.guard';
import { ListDataComponent } from './list-data/list-data.component';
import { RegisterUserComponent } from './register-user/register-user.component';
import { LoginCallbackComponent } from './login-callback/login-callback.component';

export const routes: Routes = [
  { path: 'login', component: MagicLinkLoginComponent },
  { path: 'register', component: RegisterUserComponent },
  {
    path: 'add',
    component: DataEntryComponent,
    canActivate: [authGuard],
  },
  {
    path: 'list',
    component: ListDataComponent,
    canActivate: [authGuard],
  },
  { path: 'login-callback', component: LoginCallbackComponent },
  { path: '', redirectTo: 'list', pathMatch: 'full' },
];
