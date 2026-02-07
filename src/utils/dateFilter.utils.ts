import type { SQL, AnyColumn } from 'drizzle-orm';
import { gte, lte } from 'drizzle-orm';

/**
 * Utility for creating date range filters for year and month
 */

/**
 * Creates date filter conditions for year and optional month
 * @param dateColumn - The database column to filter (e.g., table.created_at)
 * @param year - Year to filter by (e.g., 2024)
 * @param month - Optional month to filter by (1-12). If omitted, filters entire year
 * @returns Array of SQL conditions for date filtering
 */
export function getDateRangeFilters(
  dateColumn: AnyColumn,
  year?: string | number,
  month?: string | number
): SQL[] {
  const filters: SQL[] = [];

  if (typeof year === 'undefined' || year === null || year === '') {
    return filters;
  }

  const yearNum = Number(year);
  
  if (typeof month !== 'undefined' && month !== null && month !== '') {
    const monthNum = Number(month);
    // Filter by specific month in the year (1-12)
    if (monthNum >= 1 && monthNum <= 12) {
      const startDate = new Date(yearNum, monthNum - 1, 1);
      const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);
      filters.push(gte(dateColumn, startDate), lte(dateColumn, endDate));
    }
  } else {
    // Filter by entire year
    const startDate = new Date(yearNum, 0, 1);
    const endDate = new Date(yearNum, 11, 31, 23, 59, 59, 999);
    filters.push(gte(dateColumn, startDate), lte(dateColumn, endDate));
  }

  return filters;
}

/**
 * Creates date filter conditions for Stripe API queries
 * @param year - Year to filter by (e.g., 2024)
 * @param month - Optional month to filter by (1-12). If omitted, filters entire year
 * @returns Object with created.gte and created.lte timestamps for Stripe API
 */
export function getStripeDateRange(
  year?: string | number,
  month?: string | number
): { 'created[gte]'?: number; 'created[lte]'?: number } {
  if (typeof year === 'undefined' || year === null || year === '') {
    return {};
  }

  const yearNum = Number(year);
  
  if (typeof month !== 'undefined' && month !== null && month !== '') {
    const monthNum = Number(month);
    // Filter by specific month in the year (1-12)
    if (monthNum >= 1 && monthNum <= 12) {
      const startDate = new Date(yearNum, monthNum - 1, 1);
      const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);
      /* eslint-disable @typescript-eslint/naming-convention */
      return {
        'created[gte]': Math.floor(startDate.getTime() / 1000),
        'created[lte]': Math.floor(endDate.getTime() / 1000),
      };
      /* eslint-enable @typescript-eslint/naming-convention */
    }
  }
  
  // Filter by entire year
  const startDate = new Date(yearNum, 0, 1);
  const endDate = new Date(yearNum, 11, 31, 23, 59, 59, 999);
  /* eslint-disable @typescript-eslint/naming-convention */
  return {
    'created[gte]': Math.floor(startDate.getTime() / 1000),
    'created[lte]': Math.floor(endDate.getTime() / 1000),
  };
  /* eslint-enable @typescript-eslint/naming-convention */
}
