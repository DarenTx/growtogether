import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { SupabaseService } from '../services/supabase.service';
import { HeaderComponent } from '../header/header.component';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

interface MonthOption {
  value: number;
  name: string;
}

interface FormData {
  investment_firm: string;
  year: number;
  month: number;
  percentage: number | null;
}

@Component({
  selector: 'app-data-entry',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HeaderComponent],
  templateUrl: './data-entry.component.html',
  styleUrl: './data-entry.component.css',
})
export class DataEntryComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  years: number[] = [];
  months: MonthOption[] = [
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
  filteredMonths: MonthOption[] = [];
  successMessage = '';
  errorMessage = '';
  editMode = false;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly supabaseService: SupabaseService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.setupYearSubscription();
    this.checkEditMode();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    this.years = [currentYear - 1, currentYear];

    const now = new Date();
    const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();

    this.form = this.fb.group(
      {
        investment_firm: ['', [Validators.required]],
        year: [currentYear, [Validators.required]],
        month: [prevMonth, [Validators.required]],
        percentage: [null, [Validators.required]],
      },
      { validators: this.noFutureDateValidator }
    );

    this.updateFilteredMonths(currentYear);
  }

  private setupYearSubscription(): void {
    this.form
      .get('year')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((year: number) => {
        this.updateFilteredMonths(year);
        this.handleYearChange(year);
      });
  }

  private handleYearChange(year: number): void {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    if (year > currentYear) {
      this.form.get('year')?.setValue(currentYear);
      this.updateFilteredMonths(currentYear);
    }

    if (
      !this.filteredMonths.some(
        (m) => m.value === this.form.get('month')?.value
      )
    ) {
      const newMonth = year === currentYear ? currentMonth - 1 : 12;
      this.form.get('month')?.setValue(newMonth);
    }
  }

  private async checkEditMode(): Promise<void> {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (params) => {
        if (params['id']) {
          await this.handleEditMode(params['id']);
        }
      });
  }

  private async handleEditMode(id: string): Promise<void> {
    this.editMode = true;
    const row = await this.supabaseService.getMonthlyDataById(id);

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

  async onSubmit(): Promise<void> {
    if (this.form.valid) {
      const formData = this.form.getRawValue() as FormData;
      this.resetMessages();

      try {
        const userId = await this.getUserId();
        if (!userId) {
          this.errorMessage = 'User not logged in.';
          return;
        }

        if (this.editMode) {
          await this.handleUpdate(formData);
        } else {
          await this.handleInsert(formData, userId);
        }

        this.handleSuccess(formData);
      } catch (error: unknown) {
        this.handleError(error);
      }
    }
  }

  private async getUserId(): Promise<string | null> {
    const session = await this.supabaseService['supabase'].auth.getSession();
    return session.data.session?.user?.id || null;
  }

  private async handleUpdate(formData: FormData): Promise<void> {
    const id = this.route.snapshot.queryParamMap.get('id');
    if (!id) {
      throw new Error('Missing record ID for update.');
    }
    await this.supabaseService.updateMonthlyResult(
      id,
      formData.investment_firm,
      formData.percentage!
    );
  }

  private async handleInsert(
    formData: FormData,
    userId: string
  ): Promise<void> {
    await this.supabaseService.insertMonthlyResult(
      formData.year,
      formData.month,
      formData.percentage!,
      formData.investment_firm,
      userId
    );
  }

  private handleSuccess(formData: FormData): void {
    this.successMessage = 'Data saved successfully!';
    this.form.reset({
      investment_firm: '',
      year: formData.year,
      month: formData.month,
      percentage: null,
    });
    setTimeout(() => {
      this.router.navigate(['/list-data']);
    }, 500);
  }

  private handleError(error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('unique_user_month_year')) {
      this.errorMessage =
        'You have already entered data for this month and year.';
    } else {
      this.errorMessage = `Error saving data: ${errorMessage}`;
    }
  }

  private resetMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  updateFilteredMonths(selectedYear: number): void {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    this.filteredMonths =
      selectedYear === currentYear
        ? this.months.filter((m) => m.value < currentMonth)
        : [...this.months];
  }

  private noFutureDateValidator(
    formGroup: AbstractControl
  ): ValidationErrors | null {
    const year = formGroup.get('year')?.value;
    const month = formGroup.get('month')?.value;

    if (!year || !month) return null;

    const selectedDate = new Date(year, month - 1, 1);
    const now = new Date();
    const currentMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);

    return selectedDate >= currentMonthDate ? { futureDate: true } : null;
  }
}
