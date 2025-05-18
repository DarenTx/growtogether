import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { BehaviorSubject } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private authState = new BehaviorSubject<boolean>(false);

  private baseUrl =
    window.location.origin +
    window.location.pathname.split('/').slice(0, 2).join('/');
  private redirectUrl = `${this.baseUrl}/`;

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

  // #region Auth, Login, Registration, Users

  async sendMagicLink(email: string) {
    const { error } = await this.supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: this.redirectUrl,
      },
    });
    if (error) throw error;
  }

  async exchangeCodeForSession(url: string) {
    return await this.supabase.auth.exchangeCodeForSession(url);
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

  async getUser(): Promise<User | null> {
    const session = await this.supabase.auth.getSession();
    const userId = session.data.session?.user?.id;
    console.log('Auth userId:', userId);
    if (!userId) return null;
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    console.log('User row:', data, 'Error:', error);
    if (error || !data) {
      return null;
    }
    return data as User;
  }

  async userExistsByEmail(email: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  }

  async registerUser(user: User) {
    const { data, error } = await this.supabase.from('users').insert([user]);
    if (error) throw error;
    return data;
  }

  // #endregion

  // #region Retirement Results

  async insertRetirementResult(
    year: number,
    month: number,
    monthly_return: number,
    investment_firm: string,
    user_id: string
  ) {
    const { data, error } = await this.supabase
      .from('retirement_results')
      .insert([{ year, month, monthly_return, investment_firm, user_id }]);
    if (error) throw error;
    return data;
  }

  async listRetirementData(userId: string, months: number) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
    const { data, error } = await this.supabase
      .from('retirement_results')
      .select('*')
      .eq('user_id', userId)
      .order('year', { ascending: false })
      .order('month', { ascending: false });
    if (error) throw error;
    const results = (data || []).filter((row: any) => {
      const rowDate = new Date(row.year, row.month - 1, 1);
      return rowDate >= start && rowDate <= now;
    });
    results.sort((a: any, b: any) => {
      const aDate = new Date(a.year, a.month - 1, 1);
      const bDate = new Date(b.year, b.month - 1, 1);
      return bDate.getTime() - aDate.getTime();
    });
    return results.slice(0, months);
  }

  async getRetirementDataById(id: string | number) {
    const { data, error } = await this.supabase
      .from('retirement_results')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async updateRetirementResult(
    id: string | number,
    investment_firm: string,
    monthly_return: number
  ) {
    const { data, error } = await this.supabase
      .from('retirement_results')
      .update({ investment_firm, monthly_return })
      .eq('id', id);
    if (error) throw error;
    return data;
  }

  async deleteRetirementResult(id: string | number) {
    const { data, error } = await this.supabase
      .from('retirement_results')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return data;
  }

  // #endregion
}
