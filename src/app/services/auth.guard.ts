import { Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const supabaseService = inject(SupabaseService);
  const router = inject(Router);
  const isAuth = await supabaseService.isAuthenticated();
  if (!isAuth) {
    router.navigate(['/login']);
    return false;
  }
  // If authenticated, check for user row
  const user = await supabaseService.getUser();
  if (!user) {
    // Get email from session
    const session = await supabaseService['supabase'].auth.getSession();
    const email = session.data.session?.user?.email;
    router.navigate(['/register'], { queryParams: { email } });
    return false;
  }
  return true;
};
