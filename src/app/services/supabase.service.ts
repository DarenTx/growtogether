import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private authState = new BehaviorSubject<boolean>(false);

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
    // Listen for auth state changes
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.authState.next(!!session);
    });
    // Set initial state
    this.isAuthenticated().then((isAuth) => this.authState.next(isAuth));
  }

  get authState$() {
    return this.authState.asObservable();
  }

  async insertRetirementResult(
    year: number,
    month: number,
    monthly_return: number,
    investment_firm: string
  ) {
    const { data, error } = await this.supabase
      .from('retirement_results')
      .insert([{ year, month, monthly_return, investment_firm }]);
    if (error) throw error;
    return data;
  }

  async sendMagicLink(email: string) {
    const { error } = await this.supabase.auth.signInWithOtp({ email });
    if (error) throw error;
  }

  async isAuthenticated(): Promise<boolean> {
    const { data } = await this.supabase.auth.getSession();
    return !!data.session;
  }

  async logout() {
    await this.supabase.auth.signOut();
  }

  logSession() {
    this.supabase.auth.getSession().then(({ data }) => {
      console.log('Supabase session:', data.session);
    });
  }
}
