import {
  getYearTimestampRange,
  dateStringToUnixTimestamp,
  dateStringToUTC,
  getPeriodDateRange,
  getPeriodUnixTimestampRange,
} from '../src/utils/date.utils';

describe('Date Utilities', () => {
  describe('getYearTimestampRange', () => {
    it('should return correct timestamp range for 2024', () => {
      const range = getYearTimestampRange(2024);

      expect(range).toHaveProperty('start');
      expect(range).toHaveProperty('end');
      expect(typeof range.start).toBe('number');
      expect(typeof range.end).toBe('number');
      expect(range.start).toBeLessThan(range.end);
    });

    it('should start at January 1st at 00:00:00 UTC', () => {
      const range = getYearTimestampRange(2024);
      const startDate = new Date(range.start * 1000);

      expect(startDate.getUTCMonth()).toBe(0); // January
      expect(startDate.getUTCDate()).toBe(1);
      expect(startDate.getUTCHours()).toBe(0);
      expect(startDate.getUTCMinutes()).toBe(0);
      expect(startDate.getUTCSeconds()).toBe(0);
    });

    it('should end at December 31st at 23:59:59 UTC', () => {
      const range = getYearTimestampRange(2024);
      const endDate = new Date(range.end * 1000);

      expect(endDate.getUTCMonth()).toBe(11); // December
      expect(endDate.getUTCDate()).toBe(31);
      expect(endDate.getUTCHours()).toBe(23);
      expect(endDate.getUTCMinutes()).toBe(59);
      expect(endDate.getUTCSeconds()).toBe(59);
    });

    it('should handle different years correctly', () => {
      const range2020 = getYearTimestampRange(2020);
      const range2024 = getYearTimestampRange(2024);
      const range2025 = getYearTimestampRange(2025);

      expect(range2020.start).toBeLessThan(range2024.start);
      expect(range2024.start).toBeLessThan(range2025.start);
    });

    it('should be consistent across multiple calls', () => {
      const range1 = getYearTimestampRange(2024);
      const range2 = getYearTimestampRange(2024);

      expect(range1.start).toBe(range2.start);
      expect(range1.end).toBe(range2.end);
    });
  });

  describe('dateStringToUnixTimestamp', () => {
    it('should convert ISO date string to Unix timestamp', () => {
      const timestamp = dateStringToUnixTimestamp('2024-01-01');
      expect(typeof timestamp).toBe('number');
      expect(timestamp).toBeGreaterThan(0);
    });

    it('should handle full ISO 8601 datetime', () => {
      const timestamp = dateStringToUnixTimestamp('2024-01-01T12:00:00Z');
      expect(typeof timestamp).toBe('number');
      expect(timestamp).toBeGreaterThan(0);
    });

    it('should produce correct timestamp for known date', () => {
      const timestamp = dateStringToUnixTimestamp('2024-01-01T00:00:00Z');
      const date = new Date(timestamp * 1000);

      expect(date.getUTCFullYear()).toBe(2024);
      expect(date.getUTCMonth()).toBe(0);
      expect(date.getUTCDate()).toBe(1);
    });

    it('should be different for different dates', () => {
      const ts1 = dateStringToUnixTimestamp('2024-01-01');
      const ts2 = dateStringToUnixTimestamp('2024-01-02');

      expect(ts1).not.toBe(ts2);
      expect(ts2).toBeGreaterThan(ts1);
    });
  });

  describe('dateStringToUTC', () => {
    it('should return a Date object', () => {
      const date = dateStringToUTC('2024-01-01');
      expect(date instanceof Date).toBe(true);
    });

    it('should parse ISO date correctly', () => {
      const date = dateStringToUTC('2024-01-15');
      expect(date.getUTCFullYear()).toBe(2024);
      expect(date.getUTCMonth()).toBe(0);
      expect(date.getUTCDate()).toBe(15);
    });

    it('should handle full ISO 8601 datetime', () => {
      const date = dateStringToUTC('2024-06-15T14:30:00Z');
      expect(date.getUTCFullYear()).toBe(2024);
      expect(date.getUTCMonth()).toBe(5);
      expect(date.getUTCDate()).toBe(15);
      expect(date.getUTCHours()).toBe(14);
      expect(date.getUTCMinutes()).toBe(30);
    });

    it('should return valid Date for various formats', () => {
      const formats = [
        '2024-01-01',
        '2024-12-31',
        '2024-06-15T12:00:00Z',
      ];

      formats.forEach(format => {
        const date = dateStringToUTC(format);
        expect(date instanceof Date).toBe(true);
        expect(Number.isNaN(date.getTime())).toBe(false);
      });
    });
  });

  describe('getPeriodDateRange', () => {
    it('should return null for invalid period', () => {
      const range = getPeriodDateRange('invalid');
      expect(range).toBeNull();
    });

    it('should return date range for 7d period', () => {
      const range = getPeriodDateRange('7d');
      expect(range).not.toBeNull();
      expect(range).toHaveProperty('start');
      expect(range).toHaveProperty('end');
      expect(range!.start instanceof Date).toBe(true);
      expect(range!.end instanceof Date).toBe(true);
    });

    it('should return date range for 30d period', () => {
      const range = getPeriodDateRange('30d');
      expect(range).not.toBeNull();
      expect(range!.start.getTime()).toBeLessThan(range!.end.getTime());
    });

    it('should return date range for 90d period', () => {
      const range = getPeriodDateRange('90d');
      expect(range).not.toBeNull();
      const diff = range!.end.getTime() - range!.start.getTime();
      const days = diff / (1000 * 60 * 60 * 24);
      expect(days).toBeCloseTo(90, 0);
    });

    it('should return date range for 1y period', () => {
      const range = getPeriodDateRange('1y');
      expect(range).not.toBeNull();
      const diff = range!.end.getTime() - range!.start.getTime();
      const days = diff / (1000 * 60 * 60 * 24);
      expect(days).toBeCloseTo(365, 0);
    });

    it('should have end date greater than start date', () => {
      const periods = ['7d', '30d', '90d', '1y'];

      periods.forEach(period => {
        const range = getPeriodDateRange(period);
        expect(range!.start.getTime()).toBeLessThan(range!.end.getTime());
      });
    });
  });

  describe('getPeriodUnixTimestampRange', () => {
    it('should return null for invalid period', () => {
      const range = getPeriodUnixTimestampRange('invalid');
      expect(range).toBeNull();
    });

    it('should return timestamp range for valid periods', () => {
      const periods = ['7d', '30d', '90d', '1y'];

      periods.forEach(period => {
        const range = getPeriodUnixTimestampRange(period);
        expect(range).not.toBeNull();
        expect(range).toHaveProperty('start');
        expect(range).toHaveProperty('end');
        expect(typeof range!.start).toBe('number');
        expect(typeof range!.end).toBe('number');
      });
    });

    it('should have end timestamp greater than start timestamp', () => {
      const range = getPeriodUnixTimestampRange('30d');
      expect(range!.start).toBeLessThan(range!.end);
    });

    it('should return timestamps in seconds', () => {
      const range = getPeriodUnixTimestampRange('7d');
      const date = new Date(range!.start * 1000);
      expect(date instanceof Date).toBe(true);
      expect(!Number.isNaN(date.getTime())).toBe(true);
    });

    it('should be consistent with date range calculation', () => {
      const dateRange = getPeriodDateRange('30d');
      const tsRange = getPeriodUnixTimestampRange('30d');

      const dateStart = Math.floor(dateRange!.start.getTime() / 1000);
      const dateEnd = Math.floor(dateRange!.end.getTime() / 1000);

      expect(tsRange!.start).toBe(dateStart);
      expect(tsRange!.end).toBe(dateEnd);
    });
  });

  describe('Edge Cases', () => {
    it('should handle leap year correctly', () => {
      const range = getYearTimestampRange(2024);
      const startDate = new Date(range.start * 1000);
      const endDate = new Date(range.end * 1000);

      expect(startDate.getUTCFullYear()).toBe(2024);
      expect(endDate.getUTCFullYear()).toBe(2024);
    });

    it('should handle non-leap year correctly', () => {
      const range = getYearTimestampRange(2023);
      const startDate = new Date(range.start * 1000);
      const endDate = new Date(range.end * 1000);

      expect(startDate.getUTCFullYear()).toBe(2023);
      expect(endDate.getUTCFullYear()).toBe(2023);
    });

    it('should handle very old years', () => {
      const range = getYearTimestampRange(1970);
      expect(range.start).toBeLessThan(range.end);
    });

    it('should handle future years', () => {
      const range = getYearTimestampRange(2100);
      expect(range.start).toBeLessThan(range.end);
    });
  });

  describe('Timezone Consistency', () => {
    it('should always use UTC regardless of local timezone', () => {
      const year = 2024;
      const range = getYearTimestampRange(year);

      const startDate = new Date(range.start * 1000);
      const endDate = new Date(range.end * 1000);

      expect(startDate.getUTCFullYear()).toBe(year);
      expect(endDate.getUTCFullYear()).toBe(year);
      expect(startDate.getUTCMonth()).toBe(0);
      expect(endDate.getUTCMonth()).toBe(11);
    });

    it('dateStringToUTC should preserve UTC conversion', () => {
      const dateString = '2024-01-15T12:00:00Z';
      const date = dateStringToUTC(dateString);

      expect(date.getUTCFullYear()).toBe(2024);
      expect(date.getUTCMonth()).toBe(0);
      expect(date.getUTCDate()).toBe(15);
      expect(date.getUTCHours()).toBe(12);
    });
  });
});
