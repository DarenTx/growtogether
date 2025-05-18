import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { SupabaseService } from '../services/supabase.service';
import { User } from '../models/user.model';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-register-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HeaderComponent],
  templateUrl: './register-user.component.html',
  styleUrl: './register-user.component.css',
})
export class RegisterUserComponent implements OnInit {
  form: FormGroup;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      invitation_code: ['', Validators.required],
    });
  }

  ngOnInit() {
    // Pre-fill and disable email if present in query params
    const email = this.route.snapshot.queryParamMap.get('email');
    if (email) {
      this.form.get('email')?.setValue(email);
      this.form.get('email')?.disable();
    }
  }

  async onSubmit() {
    this.successMessage = '';
    this.errorMessage = '';
    if (this.form.valid) {
      let { first_name, last_name, email, phone, invitation_code } =
        this.form.value;
      invitation_code = invitation_code.toLowerCase();
      try {
        // Get the current user's id from Supabase Auth
        const session = await this.supabaseService[
          'supabase'
        ].auth.getSession();
        const userId = session.data.session?.user?.id;
        if (!userId) {
          this.errorMessage = 'User not logged in.';
          return;
        }
        // If email is disabled, get it from the form control's value or from query param
        if (this.form.get('email')?.disabled) {
          email = this.route.snapshot.queryParamMap.get('email') || email;
        }
        const user: User = {
          id: userId,
          first_name,
          last_name,
          email,
          phone,
          invitation_code,
          is_active: true,
        };
        await this.supabaseService.registerUser(user);
        this.successMessage = 'Registration successful!';
        this.form.reset();
        this.router.navigate(['/list']);
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
