import { Routes } from '@angular/router';
import { DataEntryComponent } from './data-entry/data-entry.component';
import { MagicLinkLoginComponent } from './magic-link-login/magic-link-login.component';
import { authGuard } from './services/auth.guard';
import { ListDataComponent } from './list-data/list-data.component';
import { RegisterUserComponent } from './register-user/register-user.component';

export const routes: Routes = [
  { path: 'magic-link-login', component: MagicLinkLoginComponent },
  { path: 'register', component: RegisterUserComponent },
  {
    path: 'data-entry',
    component: DataEntryComponent,
    canActivate: [authGuard],
  },
  {
    path: 'list-data',
    component: ListDataComponent,
    canActivate: [authGuard],
  },
  { path: '', redirectTo: 'list-data', pathMatch: 'full' },
];
