import { Routes } from '@angular/router';
import { DataEntryComponent } from './data-entry/data-entry.component';
import { MagicLinkLoginComponent } from './magic-link-login/magic-link-login.component';
import { authGuard } from './services/auth.guard';

export const routes: Routes = [
  { path: 'magic-link-login', component: MagicLinkLoginComponent },
  {
    path: 'data-entry',
    component: DataEntryComponent,
    canActivate: [authGuard],
  },
  { path: '', redirectTo: 'magic-link-login', pathMatch: 'full' },
];
