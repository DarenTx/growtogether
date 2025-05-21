import { Component, OnInit, OnDestroy } from '@angular/core';
import { SupabaseService } from '../services/supabase.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppNavComponent } from '../app-nav/app-nav.component';
import { User } from '../models/user.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, AppNavComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit, OnDestroy {
  isAuthenticated = false;
  user: User | null = null;

  private authSubscription?: Subscription;

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.initializeAuthState();
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
  }

  private initializeAuthState(): void {
    this.authSubscription = this.supabaseService.authState$.subscribe(
      async (isAuth) => {
        this.isAuthenticated = isAuth;
        await this.loadUser();
      }
    );
  }

  async logout(): Promise<void> {
    await this.supabaseService.logout();
    await this.router.navigate(['/login']);
  }

  get isAuthPage(): boolean {
    const url = this.router.url;
    return url === '/login' || url === '/register';
  }

  private async loadUser(): Promise<void> {
    this.user = await this.supabaseService.getUser();
  }
}
