import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { SupabaseService } from '../services/supabase.service';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-data-entry',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent],
  templateUrl: './data-entry.component.html',
  styleUrl: './data-entry.component.css',
})
export class DataEntryComponent {
  form: FormGroup;
  years: number[] = [];
  months: { value: number; name: string }[] = [
    { value: 1, name: 'January' },
    { value: 2, name: 'February' },
    { value: 3, name: 'March' },
    { value: 4, name: 'April' },
    { value: 5, name: 'May' },
    { value: 6, name: 'June' },
    { value: 7, name: 'July' },
    { value: 8, name: 'August' },
    { value: 9, name: 'September' },
    { value: 10, name: 'October' },
    { value: 11, name: 'November' },
    { value: 12, name: 'December' },
  ];
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService
  ) {
    const currentYear = new Date().getFullYear();
    this.years = [currentYear - 1, currentYear];
    const now = new Date();
    let prevMonth = now.getMonth();
    if (prevMonth === 0) {
      prevMonth = 12;
    }
    this.form = this.fb.group({
      year: [currentYear, Validators.required],
      month: [prevMonth, Validators.required],
      percentage: [
        null,
        [Validators.required, Validators.min(0), Validators.max(100)],
      ],
    });
  }

  onSubmit() {
    if (this.form.valid) {
      const { year, month, percentage } = this.form.value;
      this.successMessage = '';
      this.errorMessage = '';
      this.supabaseService
        .insertRetirementResult(year, month, percentage, 'Fidelity Investments')
        .then(() => {
          this.successMessage = 'Data saved successfully!';
          this.form.reset({
            year,
            month,
            percentage: null,
          });
        })
        .catch((error) => {
          this.errorMessage = 'Error saving data: ' + error.message;
        });
    }
  }
}
