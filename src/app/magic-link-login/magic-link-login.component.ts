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

@Component({
  selector: 'app-magic-link-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HeaderComponent],
  templateUrl: './magic-link-login.component.html',
  styleUrl: './magic-link-login.component.css',
})
export class MagicLinkLoginComponent implements OnInit {
  form: FormGroup;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  async ngOnInit() {
    if (await this.supabaseService.isAuthenticated()) {
      this.router.navigate(['/list-data']);
    }
  }

  async onSubmit() {
    if (this.form.valid) {
      this.successMessage = '';
      this.errorMessage = '';
      const { email } = this.form.value;
      try {
        await this.supabaseService.sendMagicLink(email);
        this.successMessage = 'Check your email for a login link!';
      } catch (error: any) {
        this.errorMessage =
          'Error sending magic link: ' + (error.message || error);
      }
    }
  }
}
