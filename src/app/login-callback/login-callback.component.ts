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
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  async ngOnInit() {
    const { data, error } = await this.supabaseService.exchangeCodeForSession(
      window.location.href
    );
    if (error) {
      console.error('Session error', error);
      return;
    }
    // Check if user exists in users table
    const user = await this.supabaseService.getUser();
    if (!user) {
      // Get email from session
      const session = await this.supabaseService['supabase'].auth.getSession();
      const email = session.data.session?.user?.email;
      this.router.navigate(['/register'], { queryParams: { email } });
    } else {
      this.router.navigate(['/list']);
    }
  }
}
