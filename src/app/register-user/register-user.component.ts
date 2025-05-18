import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { SupabaseService } from '../services/supabase.service';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-register-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HeaderComponent],
  templateUrl: './register-user.component.html',
  styleUrl: './register-user.component.css',
})
export class RegisterUserComponent {
  form: FormGroup;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService
  ) {
    this.form = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      invitation_code: ['', Validators.required],
    });
  }

  async onSubmit() {
    this.successMessage = '';
    this.errorMessage = '';
    if (this.form.valid) {
      let { first_name, last_name, email, phone, invitation_code } =
        this.form.value;
      invitation_code = invitation_code.toLowerCase();
      try {
        const { data, error } = await this.supabaseService['supabase']
          .from('users')
          .insert([
            {
              first_name,
              last_name,
              email,
              phone,
              invitation_code,
              is_active: true,
            },
          ]);
        if (error) throw error;
        this.successMessage = 'Registration successful!';
        this.form.reset();
      } catch (err: any) {
        if (err.message && err.message.includes('row-level security policy')) {
          this.errorMessage =
            'Registration failed: You are not authorized to register with this invitation code.';
        } else if (
          err.message &&
          err.message.includes(
            'duplicate key value violates unique constraint'
          ) &&
          err.message.includes('unique_email')
        ) {
          this.errorMessage =
            'Registration failed: This email is already registered.';
        } else if (
          err.message &&
          err.message.includes(
            'duplicate key value violates unique constraint'
          ) &&
          err.message.includes('unique_phone')
        ) {
          this.errorMessage =
            'Registration failed: This phone number is already registered.';
        } else {
          this.errorMessage = err.message || 'Registration failed.';
        }
      }
    }
  }
}
