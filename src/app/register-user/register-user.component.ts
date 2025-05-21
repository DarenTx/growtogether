import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormControl,
} from '@angular/forms';
import { SupabaseService } from '../services/supabase.service';
import { User } from '../models/user.model';
import { HeaderComponent } from '../header/header.component';

interface RegistrationForm {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  invitation_code: string;
}

@Component({
  selector: 'app-register-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HeaderComponent],
  templateUrl: './register-user.component.html',
  styleUrl: './register-user.component.css',
})
export class RegisterUserComponent implements OnInit {
  form!: FormGroup;
  successMessage = '';
  errorMessage = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly supabaseService: SupabaseService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.form = this.fb.group(
      {
        email: this.fb.control('', {
          validators: [Validators.required, Validators.email],
        }),
        password: this.fb.control('', {
          validators: [Validators.required, Validators.minLength(6)],
        }),
        confirmPassword: this.fb.control('', {
          validators: [Validators.required],
        }),
      },
      { validators: this.passwordMatchValidator }
    );
  }

  ngOnInit(): void {
    this.handleEmailPrefill();
  }

  private handleEmailPrefill(): void {
    const email = this.route.snapshot.queryParamMap.get('email');
    if (email) {
      this.form.get('email')?.setValue(email);
      this.form.get('email')?.disable();
    }
  }

  async onSubmit(): Promise<void> {
    if (this.form.valid) {
      this.resetMessages();
      const formData = this.form.getRawValue() as RegistrationForm;

      try {
        const userId = await this.getUserId();
        if (!userId) {
          this.errorMessage = 'User not logged in.';
          return;
        }

        const user = await this.createUserObject(userId, formData);
        await this.supabaseService.registerUser(user);

        this.handleSuccess();
      } catch (error: unknown) {
        this.handleError(error);
      }
    }
  }

  private async getUserId(): Promise<string | null> {
    const session = await this.supabaseService['supabase'].auth.getSession();
    return session.data.session?.user?.id || null;
  }

  private async createUserObject(
    userId: string,
    formData: RegistrationForm
  ): Promise<User> {
    const email = this.form.get('email')?.disabled
      ? this.route.snapshot.queryParamMap.get('email') || formData.email
      : formData.email;

    return {
      id: userId,
      first_name: formData.first_name,
      last_name: formData.last_name,
      email,
      phone: formData.phone,
      invitation_code: formData.invitation_code.toLowerCase(),
      is_active: true,
    };
  }

  private handleSuccess(): void {
    this.successMessage = 'Registration successful!';
    this.form.reset();
    this.router.navigate(['/list']);
  }

  private handleError(error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes('row-level security policy')) {
      this.errorMessage =
        'Registration failed: You are not authorized to register with this invitation code.';
    } else if (errorMessage.includes('unique_email')) {
      this.errorMessage =
        'Registration failed: This email is already registered.';
    } else if (errorMessage.includes('unique_phone')) {
      this.errorMessage =
        'Registration failed: This phone number is already registered.';
    } else {
      this.errorMessage = `Registration failed: ${errorMessage}`;
    }
  }

  private resetMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  private passwordMatchValidator(
    form: FormGroup
  ): { [key: string]: boolean } | null {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }
}
