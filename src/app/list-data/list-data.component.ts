import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../services/supabase.service';
import { HeaderComponent } from '../header/header.component';
import {
  SortableDirective,
  SortDirection,
  SortEvent,
} from '../directives/sortable.directive';
import { SortService } from '../services/sort.service';

interface MonthlyData {
  id?: number;
  year: number;
  month: number;
  monthly_return: number;
  investment_firm: string;
  user_id: string;
  created_at?: string;
}

@Component({
  selector: 'app-list-data',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    HeaderComponent,
    SortableDirective,
  ],
  templateUrl: './list-data.component.html',
  styleUrl: './list-data.component.css',
})
export class ListDataComponent implements OnInit {
  data: MonthlyData[] = [];
  loading = true;
  error = '';
  filterFirm = '';
  sortColumn: keyof MonthlyData = 'investment_firm';
  sortDirection: SortDirection = 'asc';

  private readonly months = 12;
  private readonly monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  private readonly monthAbbrs = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly sortService: SortService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  private async loadData(): Promise<void> {
    this.loading = true;
    this.error = '';

    try {
      const userId = await this.getUserId();
      if (!userId) {
        this.error = 'User not logged in.';
        return;
      }

      this.data = await this.supabaseService.listMonthlyData(
        userId,
        this.months
      );
    } catch (error: unknown) {
      this.error =
        error instanceof Error ? error.message : 'Failed to load data.';
    } finally {
      this.loading = false;
    }
  }

  private async getUserId(): Promise<string | null> {
    const session = await this.supabaseService['supabase'].auth.getSession();
    return session.data.session?.user?.id || null;
  }

  getMonthName(monthNumber: number): string {
    return this.monthNames[monthNumber - 1] || '';
  }

  getMonthAbbr(monthNumber: number): string {
    return this.monthAbbrs[monthNumber - 1] || '';
  }

  async deleteRow(
    id: number | undefined,
    month: number,
    year: number
  ): Promise<void> {
    if (!id) {
      this.error = 'Cannot delete: Missing record ID';
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to delete the entry for ${this.getMonthName(
        month
      )} ${year}?`
    );

    if (!confirmed) return;

    try {
      await this.supabaseService.deleteMonthlyResult(id);
      await this.loadData();
    } catch (error: unknown) {
      this.error =
        error instanceof Error ? error.message : 'Failed to delete row.';
    }
  }

  onSort(event: SortEvent): void {
    this.sortColumn = event.column as keyof MonthlyData;
    this.sortDirection = event.direction;
  }

  get filteredData(): MonthlyData[] {
    let filtered = this.filterFirm.trim()
      ? this.data.filter((row) =>
          row.investment_firm
            ?.toLowerCase()
            .includes(this.filterFirm.trim().toLowerCase())
        )
      : this.data;

    return this.sortService.sort(filtered, this.sortColumn, this.sortDirection);
  }

  get firmOptions(): string[] {
    return Array.from(
      new Set(this.data.map((row) => row.investment_firm).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
  }
}
