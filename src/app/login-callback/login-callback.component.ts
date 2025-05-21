import { Component, OnInit } from '@angular/core';
import { SupabaseService } from '../services/supabase.service';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-login-callback',
  template: `<p>Logging you in...</p>`,
})
export class LoginCallbackComponent implements OnInit {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      await this.handleLoginCallback();
    } catch (error: unknown) {
      console.error('Login callback error:', error);
    }
  }

  private async handleLoginCallback(): Promise<void> {
    try {
      await this.supabaseService.exchangeCodeForSession(window.location.href);
    } catch (error: unknown) {
      console.error('Session error:', error);
      return;
    }

    const user = await this.supabaseService.getUser();
    if (!user) {
      await this.handleNewUser();
    } else {
      await this.router.navigate(['/list']);
    }
  }

  private async handleNewUser(): Promise<void> {
    const session = await this.supabaseService['supabase'].auth.getSession();
    const email = session.data.session?.user?.email;

    if (email) {
      await this.router.navigate(['/register'], { queryParams: { email } });
    } else {
      console.error('No email found in session');
    }
  }
}
