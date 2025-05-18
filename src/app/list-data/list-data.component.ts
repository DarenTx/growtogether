import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../services/supabase.service';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-list-data',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent],
  templateUrl: './list-data.component.html',
  styleUrl: './list-data.component.css',
})
export class ListDataComponent implements OnInit {
  data: any[] = [];
  loading = true;
  error = '';
  private months = 12;
  filterFirm: string = '';
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(private supabaseService: SupabaseService) {}

  async ngOnInit() {
    await this.loadData();
  }

  private async loadData() {
    this.loading = true;
    this.error = '';
    try {
      const session = await this.supabaseService['supabase'].auth.getSession();
      const userId = session.data.session?.user?.id;
      console.log('Current userId:', userId);
      if (!userId) {
        this.error = 'User not logged in.';
        this.loading = false;
        return;
      }
      this.data = await this.supabaseService.listRetirementData(
        userId,
        this.months
      );
    } catch (err: any) {
      this.error = err.message || 'Failed to load data.';
    } finally {
      this.loading = false;
    }
  }

  getMonthName(monthNumber: number): string {
    const monthNames = [
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
    return monthNames[monthNumber - 1] || '';
  }

  getMonthAbbr(monthNumber: number): string {
    const monthAbbrs = [
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
    return monthAbbrs[monthNumber - 1] || '';
  }

  async deleteRow(id: string | number, month: number, year: number) {
    const confirmed = confirm(
      `Are you sure you want to delete the entry for ${this.getMonthName(
        month
      )} ${year}?`
    );
    if (!confirmed) return;
    try {
      await this.supabaseService.deleteRetirementResult(id);
      await this.loadData();
    } catch (err: any) {
      this.error = err.message || 'Failed to delete row.';
    }
  }

  setSort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  }

  get filteredData() {
    let filtered = !this.filterFirm.trim()
      ? this.data
      : this.data.filter(
          (row) =>
            row.investment_firm &&
            row.investment_firm
              .toLowerCase()
              .includes(this.filterFirm.trim().toLowerCase())
        );
    if (!this.sortColumn) return filtered;
    return [...filtered].sort((a, b) => {
      let result = 0;
      if (this.sortColumn === 'investment_firm') {
        result = a.investment_firm.localeCompare(b.investment_firm);
      } else if (this.sortColumn === 'period') {
        // Sort by year, then month
        result = a.year - b.year || a.month - b.month;
      } else if (this.sortColumn === 'ytd_return') {
        result = a.monthly_return - b.monthly_return;
      }
      return this.sortDirection === 'asc' ? result : -result;
    });
  }

  get firmOptions(): string[] {
    const firms = Array.from(
      new Set(this.data.map((row) => row.investment_firm).filter(Boolean))
    );
    firms.sort((a, b) => a.localeCompare(b));
    return firms;
  }
}
