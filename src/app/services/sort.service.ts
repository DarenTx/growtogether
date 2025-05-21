import { Injectable } from '@angular/core';
import { SortDirection, SortEvent } from '../directives/sortable.directive';

@Injectable({
  providedIn: 'root',
})
export class SortService {
  sort<T>(items: T[], column: keyof T, direction: SortDirection): T[] {
    return [...items].sort((a, b) => {
      const aValue = a[column];
      const bValue = b[column];

      if (aValue === bValue) return 0;

      const result = this.compare(aValue, bValue);
      return direction === 'asc' ? result : -result;
    });
  }

  private compare(a: any, b: any): number {
    if (typeof a === 'string' && typeof b === 'string') {
      return a.localeCompare(b);
    }
    if (typeof a === 'number' && typeof b === 'number') {
      return a - b;
    }
    if (a instanceof Date && b instanceof Date) {
      return a.getTime() - b.getTime();
    }
    return 0;
  }
}
