/**
 * Date utility functions for consistent UTC handling across the API
 * All Stripe timestamps are stored as Unix timestamps (seconds since epoch)
 * All database timestamps use UTC ISO 8601 format
 */

/**
 * Convert year to Unix timestamp range (in seconds)
 * @param year - Year to convert (e.g., 2024)
 * @returns Object with startTimestamp and endTimestamp in Unix seconds
 */
export function getYearTimestampRange(year: number): { start: number; end: number } {
  const startOfYear = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
  const endOfYear = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
  
  return {
    start: Math.floor(startOfYear.getTime() / 1000),
    end: Math.floor(endOfYear.getTime() / 1000)
  };
}

/**
 * Convert ISO date string to Unix timestamp (in seconds)
 * @param dateString - ISO date string (YYYY-MM-DD or full ISO 8601)
 * @returns Unix timestamp in seconds
 */
export function dateStringToUnixTimestamp(dateString: string): number {
  const date = new Date(dateString);
  return Math.floor(date.getTime() / 1000);
}

/**
 * Convert ISO date string to UTC Date object
 * @param dateString - ISO date string
 * @returns Date object
 */
export function dateStringToUTC(dateString: string): Date {
  return new Date(dateString);
}

/**
 * Get date range from period string
 * @param period - Period like '7d', '30d', '90d', '1y'
 * @returns Object with start and end Date objects
 */
export function getPeriodDateRange(period: string): { start: Date; end: Date } | null {
  const periodMap: Record<string, number> = { 
    '7d': 7, 
    '30d': 30, 
    '90d': 90, 
    '1y': 365 
  };
  
  const days = periodMap[period];
  if (!days) {return null;}
  
  const end = new Date();
  const start = new Date(end.getTime() - (days * 24 * 60 * 60 * 1000));
  
  return { start, end };
}

/**
 * Get Unix timestamp range from period string (in seconds)
 * @param period - Period like '7d', '30d', '90d', '1y'
 * @returns Object with start and end timestamps in Unix seconds, or null if invalid
 */
export function getPeriodUnixTimestampRange(period: string): { start: number; end: number } | null {
  const range = getPeriodDateRange(period);
  if (!range) {return null;}
  
  return {
    start: Math.floor(range.start.getTime() / 1000),
    end: Math.floor(range.end.getTime() / 1000)
  };
}
