import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent],
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
      this.router.navigate(['/data-entry']);
    }
  }

  onSubmit() {
    if (this.form.valid) {
      this.successMessage = '';
      this.errorMessage = '';
      const { email } = this.form.value;
      this.supabaseService
        .sendMagicLink(email)
        .then(() => {
          this.successMessage = 'Check your email for a login link!';
        })
        .catch((error) => {
          this.errorMessage = 'Error sending magic link: ' + error.message;
        });
    }
  }
}
