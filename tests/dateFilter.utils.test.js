"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dateFilter_utils_1 = require("../src/utils/dateFilter.utils");
describe('Date Filter Utilities', () => {
    describe('getDateRangeFilters', () => {
        it('should return empty array when year is not provided', () => {
            const mockColumn = {};
            const filters = (0, dateFilter_utils_1.getDateRangeFilters)(mockColumn);
            expect(filters).toEqual([]);
        });
        it('should return empty array when year is undefined', () => {
            const mockColumn = {};
            const filters = (0, dateFilter_utils_1.getDateRangeFilters)(mockColumn, undefined);
            expect(filters).toEqual([]);
        });
        it('should return filters for entire year when month is not provided', () => {
            const mockColumn = {};
            const filters = (0, dateFilter_utils_1.getDateRangeFilters)(mockColumn, 2024);
            expect(filters).toHaveLength(2);
            expect(Array.isArray(filters)).toBe(true);
        });
        it('should return filters for entire year with string year', () => {
            const mockColumn = {};
            const filters = (0, dateFilter_utils_1.getDateRangeFilters)(mockColumn, '2024');
            expect(filters).toHaveLength(2);
        });
        it('should return filters for specific month', () => {
            const mockColumn = {};
            const filters = (0, dateFilter_utils_1.getDateRangeFilters)(mockColumn, 2024, 1);
            expect(filters).toHaveLength(2);
        });
        it('should return filters for specific month with string inputs', () => {
            const mockColumn = {};
            const filters = (0, dateFilter_utils_1.getDateRangeFilters)(mockColumn, '2024', '6');
            expect(filters).toHaveLength(2);
        });
        it('should handle all valid months (1-12)', () => {
            const mockColumn = {};
            for (let month = 1; month <= 12; month++) {
                const filters = (0, dateFilter_utils_1.getDateRangeFilters)(mockColumn, 2024, month);
                expect(filters).toHaveLength(2);
            }
        });
        it('should return empty array for invalid month (0)', () => {
            const mockColumn = {};
            const filters = (0, dateFilter_utils_1.getDateRangeFilters)(mockColumn, 2024, 0);
            expect(filters).toHaveLength(0);
        });
        it('should return empty array for invalid month (13)', () => {
            const mockColumn = {};
            const filters = (0, dateFilter_utils_1.getDateRangeFilters)(mockColumn, 2024, 13);
            expect(filters).toHaveLength(0);
        });
        it('should handle leap year February correctly', () => {
            const mockColumn = {};
            const filters = (0, dateFilter_utils_1.getDateRangeFilters)(mockColumn, 2024, 2);
            expect(filters).toHaveLength(2);
        });
        it('should handle non-leap year February correctly', () => {
            const mockColumn = {};
            const filters = (0, dateFilter_utils_1.getDateRangeFilters)(mockColumn, 2023, 2);
            expect(filters).toHaveLength(2);
        });
        it('should handle December correctly', () => {
            const mockColumn = {};
            const filters = (0, dateFilter_utils_1.getDateRangeFilters)(mockColumn, 2024, 12);
            expect(filters).toHaveLength(2);
        });
    });
    describe('getStripeDateRange', () => {
        it('should return empty object when year is not provided', () => {
            const range = (0, dateFilter_utils_1.getStripeDateRange)();
            expect(range).toEqual({});
        });
        it('should return empty object when year is undefined', () => {
            const range = (0, dateFilter_utils_1.getStripeDateRange)(undefined);
            expect(range).toEqual({});
        });
        it('should return timestamp range for entire year', () => {
            const range = (0, dateFilter_utils_1.getStripeDateRange)(2024);
            expect(range).toHaveProperty('created[gte]');
            expect(range).toHaveProperty('created[lte]');
            expect(typeof range['created[gte]']).toBe('number');
            expect(typeof range['created[lte]']).toBe('number');
        });
        it('should return timestamp range for entire year with string input', () => {
            const range = (0, dateFilter_utils_1.getStripeDateRange)('2024');
            expect(range).toHaveProperty('created[gte]');
            expect(range).toHaveProperty('created[lte]');
        });
        it('should have gte less than lte for entire year', () => {
            const range = (0, dateFilter_utils_1.getStripeDateRange)(2024);
            expect(range['created[gte]']).toBeLessThan(range['created[lte]']);
        });
        it('should return timestamp range for specific month', () => {
            const range = (0, dateFilter_utils_1.getStripeDateRange)(2024, 1);
            expect(range).toHaveProperty('created[gte]');
            expect(range).toHaveProperty('created[lte]');
        });
        it('should return timestamp range for specific month with string inputs', () => {
            const range = (0, dateFilter_utils_1.getStripeDateRange)('2024', '6');
            expect(range).toHaveProperty('created[gte]');
            expect(range).toHaveProperty('created[lte]');
        });
        it('should have gte less than lte for specific month', () => {
            const range = (0, dateFilter_utils_1.getStripeDateRange)(2024, 6);
            expect(range['created[gte]']).toBeLessThan(range['created[lte]']);
        });
        it('should return Unix timestamps in seconds', () => {
            const range = (0, dateFilter_utils_1.getStripeDateRange)(2024);
            const gteString = range['created[gte]'].toString();
            const lteString = range['created[lte]'].toString();
            expect(gteString.length).toBe(10);
            expect(lteString.length).toBe(10);
        });
        it('should handle all valid months (1-12)', () => {
            for (let month = 1; month <= 12; month++) {
                const range = (0, dateFilter_utils_1.getStripeDateRange)(2024, month);
                expect(range).toHaveProperty('created[gte]');
                expect(range).toHaveProperty('created[lte]');
                expect(range['created[gte]']).toBeLessThan(range['created[lte]']);
            }
        });
        it('should return empty object for invalid month (0)', () => {
            const range = (0, dateFilter_utils_1.getStripeDateRange)(2024, 0);
            expect(range).toEqual({});
        });
        it('should return empty object for invalid month (13)', () => {
            const range = (0, dateFilter_utils_1.getStripeDateRange)(2024, 13);
            expect(range).toEqual({});
        });
        it('should handle leap year February correctly', () => {
            const range = (0, dateFilter_utils_1.getStripeDateRange)(2024, 2);
            const startDate = new Date(range['created[gte]'] * 1000);
            const endDate = new Date(range['created[lte]'] * 1000);
            expect(startDate.getUTCMonth()).toBe(1);
            expect(endDate.getUTCMonth()).toBe(1);
            expect(endDate.getUTCDate()).toBe(29);
        });
        it('should handle non-leap year February correctly', () => {
            const range = (0, dateFilter_utils_1.getStripeDateRange)(2023, 2);
            const startDate = new Date(range['created[gte]'] * 1000);
            const endDate = new Date(range['created[lte]'] * 1000);
            expect(startDate.getUTCMonth()).toBe(1);
            expect(endDate.getUTCMonth()).toBe(1);
            expect(endDate.getUTCDate()).toBe(28);
        });
        it('should start at first day of month at 00:00:00', () => {
            const range = (0, dateFilter_utils_1.getStripeDateRange)(2024, 6);
            const startDate = new Date(range['created[gte]'] * 1000);
            expect(startDate.getUTCDate()).toBe(1);
            expect(startDate.getUTCHours()).toBe(0);
            expect(startDate.getUTCMinutes()).toBe(0);
            expect(startDate.getUTCSeconds()).toBe(0);
        });
        it('should end at last day of month at 23:59:59', () => {
            const range = (0, dateFilter_utils_1.getStripeDateRange)(2024, 6);
            const endDate = new Date(range['created[lte]'] * 1000);
            expect(endDate.getUTCDate()).toBe(30);
            expect(endDate.getUTCHours()).toBe(23);
            expect(endDate.getUTCMinutes()).toBe(59);
            expect(endDate.getUTCSeconds()).toBe(59);
        });
        it('should handle January correctly', () => {
            const range = (0, dateFilter_utils_1.getStripeDateRange)(2024, 1);
            const startDate = new Date(range['created[gte]'] * 1000);
            const endDate = new Date(range['created[lte]'] * 1000);
            expect(startDate.getUTCMonth()).toBe(0);
            expect(endDate.getUTCMonth()).toBe(0);
            expect(endDate.getUTCDate()).toBe(31);
        });
        it('should handle December correctly', () => {
            const range = (0, dateFilter_utils_1.getStripeDateRange)(2024, 12);
            const startDate = new Date(range['created[gte]'] * 1000);
            const endDate = new Date(range['created[lte]'] * 1000);
            expect(startDate.getUTCMonth()).toBe(11);
            expect(endDate.getUTCMonth()).toBe(11);
            expect(endDate.getUTCDate()).toBe(31);
        });
        it('should produce consistent results across multiple calls', () => {
            const range1 = (0, dateFilter_utils_1.getStripeDateRange)(2024, 6);
            const range2 = (0, dateFilter_utils_1.getStripeDateRange)(2024, 6);
            expect(range1['created[gte]']).toBe(range2['created[gte]']);
            expect(range1['created[lte]']).toBe(range2['created[lte]']);
        });
        it('should handle different years correctly', () => {
            const range2023 = (0, dateFilter_utils_1.getStripeDateRange)(2023);
            const range2024 = (0, dateFilter_utils_1.getStripeDateRange)(2024);
            const range2025 = (0, dateFilter_utils_1.getStripeDateRange)(2025);
            expect(range2023['created[gte]']).toBeLessThan(range2024['created[gte]']);
            expect(range2024['created[gte]']).toBeLessThan(range2025['created[gte]']);
        });
    });
    describe('Edge Cases', () => {
        it('should handle very old years', () => {
            const range = (0, dateFilter_utils_1.getStripeDateRange)(1970);
            expect(range).toHaveProperty('created[gte]');
            expect(range).toHaveProperty('created[lte]');
        });
        it('should handle future years', () => {
            const range = (0, dateFilter_utils_1.getStripeDateRange)(2100);
            expect(range).toHaveProperty('created[gte]');
            expect(range).toHaveProperty('created[lte]');
        });
        it('should handle negative month gracefully', () => {
            const range = (0, dateFilter_utils_1.getStripeDateRange)(2024, -1);
            expect(range).toEqual({});
        });
        it('should handle very large month number gracefully', () => {
            const range = (0, dateFilter_utils_1.getStripeDateRange)(2024, 999);
            expect(range).toEqual({});
        });
        it('should handle year 0', () => {
            const range = (0, dateFilter_utils_1.getStripeDateRange)(0);
            expect(range).toHaveProperty('created[gte]');
            expect(range).toHaveProperty('created[lte]');
        });
    });
});
//# sourceMappingURL=dateFilter.utils.test.js.map