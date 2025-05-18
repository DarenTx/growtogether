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
import { Router, RouterModule, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-data-entry',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HeaderComponent],
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
  filteredMonths: { value: number; name: string }[] = [];
  successMessage = '';
  errorMessage = '';
  editMode = false;

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // getMonth() is 0-based
    this.years = [currentYear - 1, currentYear];
    const now = new Date();
    let prevMonth = now.getMonth();
    if (prevMonth === 0) {
      prevMonth = 12;
    }
    this.form = this.fb.group(
      {
        investment_firm: ['', Validators.required],
        year: [currentYear, Validators.required],
        month: [prevMonth, Validators.required],
        percentage: [null, [Validators.required]],
      },
      { validators: this.noFutureDateValidator }
    );
    this.updateFilteredMonths(currentYear);
    this.form.get('year')?.valueChanges.subscribe((year) => {
      this.updateFilteredMonths(year);
      // If the selected year is in the future, reset to current year
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      if (year > currentYear) {
        this.form.get('year')?.setValue(currentYear);
        this.updateFilteredMonths(currentYear);
      }
      // If the selected month is now invalid, reset it
      if (
        !this.filteredMonths.some(
          (m) => m.value === this.form.get('month')?.value
        )
      ) {
        // For current year, set to previous valid month; for past year, set to December
        const newMonth = year === currentYear ? currentMonth - 1 : 12;
        this.form.get('month')?.setValue(newMonth);
      }
    });

    // Check for query param 'id' to prepopulate form for editing
    this.route.queryParams.subscribe(async (params) => {
      if (params['id']) {
        this.editMode = true;
        // Fetch the row data by id
        const row = await this.supabaseService.getRetirementDataById(
          params['id']
        );
        if (row) {
          this.form.patchValue({
            investment_firm: row.investment_firm || '',
            year: +row.year,
            month: +row.month,
            percentage:
              row.monthly_return !== undefined ? +row.monthly_return : null,
          });
          this.form.get('year')?.disable();
          this.form.get('month')?.disable();
        }
      }
    });
  }

  async onSubmit() {
    if (this.form.valid) {
      const { year, month, percentage, investment_firm } =
        this.form.getRawValue();
      this.successMessage = '';
      this.errorMessage = '';
      try {
        const session = await this.supabaseService[
          'supabase'
        ].auth.getSession();
        const userId = session.data.session?.user?.id;
        if (!userId) {
          this.errorMessage = 'User not logged in.';
          return;
        }
        if (this.editMode) {
          // Get id from query params
          const id = this.route.snapshot.queryParamMap.get('id');
          if (!id) {
            this.errorMessage = 'Missing record ID for update.';
            return;
          }
          await this.supabaseService.updateRetirementResult(
            id,
            investment_firm,
            percentage
          );
        } else {
          await this.supabaseService.insertRetirementResult(
            year,
            month,
            percentage,
            investment_firm,
            userId
          );
        }
        this.successMessage = 'Data saved successfully!';
        this.form.reset({
          investment_firm: '',
          year,
          month,
          percentage: null,
        });
        setTimeout(() => {
          this.router.navigate(['/list-data']);
        }, 500);
      } catch (error: any) {
        if (
          error.message &&
          error.message.includes(
            'duplicate key value violates unique constraint'
          ) &&
          error.message.includes('unique_user_month_year')
        ) {
          this.errorMessage =
            'You have already entered data for this month and year.';
        } else {
          this.errorMessage = 'Error saving data: ' + (error.message || error);
        }
      }
    }
  }

  updateFilteredMonths(selectedYear: number) {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    if (selectedYear === currentYear) {
      // Only allow months before the current month
      this.filteredMonths = this.months.filter((m) => m.value < currentMonth);
    } else {
      // Allow all months for previous years
      this.filteredMonths = [...this.months];
    }
  }

  noFutureDateValidator(formGroup: FormGroup) {
    const year = formGroup.get('year')?.value;
    const month = formGroup.get('month')?.value;
    if (!year || !month) return null;
    // Construct the first day of the selected month
    const selectedDate = new Date(year, month - 1, 1);
    // Construct the first day of the current month
    const now = new Date();
    const currentMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);
    if (selectedDate >= currentMonthDate) {
      return { futureDate: true };
    }
    return null;
  }
}
