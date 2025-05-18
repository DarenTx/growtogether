import { Component, OnInit, OnDestroy } from '@angular/core';
import { SupabaseService } from '../services/supabase.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppNavComponent } from '../app-nav/app-nav.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, AppNavComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit, OnDestroy {
  isAuthenticated = false;
  private sub?: Subscription;
  user: any = null;

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  ngOnInit() {
    this.supabaseService.logSession();
    this.sub = this.supabaseService.authState$.subscribe((isAuth) => {
      this.isAuthenticated = isAuth;
      this.loadUser();
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  async logout() {
    await this.supabaseService.logout();
    this.router.navigate(['/login']);
  }

  get isAuthPage(): boolean {
    const url = this.router.url;
    return url === '/login' || url === '/register';
  }

  private async loadUser() {
    this.user = await this.supabaseService.getUser();
  }
}
