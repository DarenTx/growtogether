import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../models/user.model';

interface MonthlyResult {
  id?: number;
  year: number;
  month: number;
  monthly_return: number;
  investment_firm: string;
  user_id: string;
  created_at?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private readonly supabase: SupabaseClient;
  private readonly authState = new BehaviorSubject<boolean>(false);

  // Table names as private constants
  private readonly TABLE_USERS = 'users';
  private readonly TABLE_MONTHLY_RESULTS = 'monthly_results';

  // Computed redirect URL
  private readonly redirectUrl: string;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );

    this.redirectUrl = `${window.location.origin}${window.location.pathname
      .split('/')
      .slice(0, 2)
      .join('/')}/`;

    this.initializeAuthState();
  }

  private async initializeAuthState(): Promise<void> {
    // Listen for auth state changes
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.authState.next(!!session);
    });
    // Set initial state
    const isAuth = await this.isAuthenticated();
    this.authState.next(isAuth);
  }

  get authState$(): Observable<boolean> {
    return this.authState.asObservable();
  }

  // #region Auth, Login, Registration, Users

  async sendMagicLink(email: string): Promise<void> {
    const { error } = await this.supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: this.redirectUrl,
      },
    });
    if (error) throw error;
  }

  async exchangeCodeForSession(url: string): Promise<void> {
    await this.supabase.auth.exchangeCodeForSession(url);
  }

  async isAuthenticated(): Promise<boolean> {
    const { data } = await this.supabase.auth.getSession();
    return !!data.session;
  }

  async logout(): Promise<void> {
    await this.supabase.auth.signOut();
  }

  async getUser(): Promise<User | null> {
    const session = await this.supabase.auth.getSession();
    const userId = session.data.session?.user?.id;

    if (!userId) return null;

    const { data, error } = await this.supabase
      .from(this.TABLE_USERS)
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }
    return data as User;
  }

  async userExistsByEmail(email: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from(this.TABLE_USERS)
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  }

  async registerUser(user: User): Promise<User> {
    const { data, error } = await this.supabase
      .from(this.TABLE_USERS)
      .insert([user])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // #endregion

  // #region Monthly Results

  async insertMonthlyResult(
    year: number,
    month: number,
    monthly_return: number,
    investment_firm: string,
    user_id: string
  ): Promise<MonthlyResult> {
    const { data, error } = await this.supabase
      .from(this.TABLE_MONTHLY_RESULTS)
      .insert([{ year, month, monthly_return, investment_firm, user_id }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async listMonthlyData(
    userId: string,
    months: number
  ): Promise<MonthlyResult[]> {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

    const { data, error } = await this.supabase
      .from(this.TABLE_MONTHLY_RESULTS)
      .select('*')
      .eq('user_id', userId)
      .order('year', { ascending: false })
      .order('month', { ascending: false });

    if (error) throw error;

    const results = (data || []).filter((row: MonthlyResult) => {
      const rowDate = new Date(row.year, row.month - 1, 1);
      return rowDate >= start && rowDate <= now;
    });

    results.sort((a: MonthlyResult, b: MonthlyResult) => {
      const aDate = new Date(a.year, a.month - 1, 1);
      const bDate = new Date(b.year, b.month - 1, 1);
      return bDate.getTime() - aDate.getTime();
    });

    return results.slice(0, months);
  }

  async getMonthlyDataById(id: string | number): Promise<MonthlyResult | null> {
    const { data, error } = await this.supabase
      .from(this.TABLE_MONTHLY_RESULTS)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async updateMonthlyResult(
    id: string | number,
    investment_firm: string,
    monthly_return: number
  ): Promise<MonthlyResult> {
    const { data, error } = await this.supabase
      .from(this.TABLE_MONTHLY_RESULTS)
      .update({ investment_firm, monthly_return })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteMonthlyResult(id: string | number): Promise<void> {
    const { error } = await this.supabase
      .from(this.TABLE_MONTHLY_RESULTS)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // #endregion
}
