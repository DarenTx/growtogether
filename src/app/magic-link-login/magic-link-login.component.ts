import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { SupabaseService } from '../services/supabase.service';
import { Router } from '@angular/router';
import { HeaderComponent } from '../header/header.component';

interface LoginForm {
  email: string;
}

@Component({
  selector: 'app-magic-link-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HeaderComponent],
  templateUrl: './magic-link-login.component.html',
  styleUrl: './magic-link-login.component.css',
})
export class MagicLinkLoginComponent implements OnInit {
  form!: FormGroup;
  successMessage = '';
  errorMessage = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly supabaseService: SupabaseService,
    private readonly router: Router
  ) {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  async ngOnInit(): Promise<void> {
    if (await this.supabaseService.isAuthenticated()) {
      await this.router.navigate(['/list']);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.form.valid) {
      this.resetMessages();
      const { email } = this.form.value as LoginForm;

      try {
        await this.supabaseService.sendMagicLink(email);
        this.successMessage = 'Check your email for a login link!';
      } catch (error: unknown) {
        this.handleError(error);
      }
    }
  }

  private resetMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  private handleError(error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    this.errorMessage = `Error sending magic link: ${errorMessage}`;
  }
}
