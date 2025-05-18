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
    } else {
      // Session stored, now redirect to main view
      this.router.navigate(['/list']);
    }
  }
}
