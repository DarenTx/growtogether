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
    investment_firm: string,
    user_id: string
  ) {
    const { data, error } = await this.supabase
      .from('retirement_results')
      .insert([{ year, month, monthly_return, investment_firm, user_id }]);
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

  async listRetirementData(userId: string, months: number) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
    // If you have a timestamp column (e.g., created_at), use it for filtering:
    // const { data, error } = await this.supabase
    //   .from('retirement_results')
    //   .select('*')
    //   .eq('user_id', userId)
    //   .gte('created_at', start.toISOString())
    //   .order('year', { ascending: false })
    //   .order('month', { ascending: false })
    //   .limit(months);
    //   if (error) throw error;
    //   return data;

    // If you do not have a timestamp, fetch all and filter in JS:
    const { data, error } = await this.supabase
      .from('retirement_results')
      .select('*')
      .eq('user_id', userId)
      .order('year', { ascending: false })
      .order('month', { ascending: false });
    if (error) throw error;
    // Filter in JS for last N months
    const results = (data || []).filter((row: any) => {
      const rowDate = new Date(row.year, row.month - 1, 1);
      return rowDate >= start && rowDate <= now;
    });
    // Sort descending and take the most recent N
    results.sort((a: any, b: any) => {
      const aDate = new Date(a.year, a.month - 1, 1);
      const bDate = new Date(b.year, b.month - 1, 1);
      return bDate.getTime() - aDate.getTime();
    });
    return results.slice(0, months);
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

  async exchangeCodeForSession(url: string) {
    return await this.supabase.auth.exchangeCodeForSession(url);
  }
}
