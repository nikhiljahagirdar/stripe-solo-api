"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const validation_middleware_1 = require("../../src/middleware/validation.middleware");
describe('Validation Middleware', () => {
    let mockReq;
    let mockRes;
    let mockNext;
    beforeEach(() => {
        mockReq = {
            query: {},
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        mockNext = jest.fn();
    });
    describe('isValidDateString', () => {
        it('should return true for valid YYYY-MM-DD format', () => {
            expect((0, validation_middleware_1.isValidDateString)('2024-01-15')).toBe(true);
            expect((0, validation_middleware_1.isValidDateString)('2024-12-31')).toBe(true);
            expect((0, validation_middleware_1.isValidDateString)('2000-06-15')).toBe(true);
        });
        it('should return true for ISO 8601 format', () => {
            expect((0, validation_middleware_1.isValidDateString)('2024-01-15T00:00:00Z')).toBe(true);
            expect((0, validation_middleware_1.isValidDateString)('2024-01-15T12:30:45Z')).toBe(true);
        });
        it('should return true for empty string', () => {
            expect((0, validation_middleware_1.isValidDateString)('')).toBe(true);
        });
        it('should return false for invalid format', () => {
            expect((0, validation_middleware_1.isValidDateString)('01/15/2024')).toBe(false);
            expect((0, validation_middleware_1.isValidDateString)('15-01-2024')).toBe(false);
            expect((0, validation_middleware_1.isValidDateString)('2024/01/15')).toBe(false);
        });
        it('should return false for invalid date', () => {
            expect((0, validation_middleware_1.isValidDateString)('2024-13-01')).toBe(false);
            expect((0, validation_middleware_1.isValidDateString)('2024-01-32')).toBe(false);
            expect((0, validation_middleware_1.isValidDateString)('2024-02-30')).toBe(false);
        });
        it('should return false for malformed date', () => {
            expect((0, validation_middleware_1.isValidDateString)('2024-1-15')).toBe(false);
            expect((0, validation_middleware_1.isValidDateString)('not-a-date')).toBe(false);
            expect((0, validation_middleware_1.isValidDateString)('2024')).toBe(false);
        });
        it('should return false for null or undefined (treated as string)', () => {
            expect((0, validation_middleware_1.isValidDateString)(null)).toBe(false);
            expect((0, validation_middleware_1.isValidDateString)(undefined)).toBe(false);
        });
    });
    describe('isValidYear', () => {
        it('should return true for valid years', () => {
            expect((0, validation_middleware_1.isValidYear)(2020)).toBe(true);
            expect((0, validation_middleware_1.isValidYear)(2024)).toBe(true);
            expect((0, validation_middleware_1.isValidYear)(2025)).toBe(true);
            expect((0, validation_middleware_1.isValidYear)(1900)).toBe(true);
            expect((0, validation_middleware_1.isValidYear)(2100)).toBe(true);
        });
        it('should return true for valid year strings', () => {
            expect((0, validation_middleware_1.isValidYear)('2024')).toBe(true);
            expect((0, validation_middleware_1.isValidYear)('2020')).toBe(true);
        });
        it('should return true for empty/undefined', () => {
            expect((0, validation_middleware_1.isValidYear)(undefined)).toBe(true);
            expect((0, validation_middleware_1.isValidYear)(null)).toBe(true);
            expect((0, validation_middleware_1.isValidYear)('')).toBe(true);
        });
        it('should return false for years before 1900', () => {
            expect((0, validation_middleware_1.isValidYear)(1899)).toBe(false);
            expect((0, validation_middleware_1.isValidYear)(1800)).toBe(false);
        });
        it('should return false for years after 2100', () => {
            expect((0, validation_middleware_1.isValidYear)(2101)).toBe(false);
            expect((0, validation_middleware_1.isValidYear)(3000)).toBe(false);
        });
        it('should return false for non-integer years', () => {
            expect((0, validation_middleware_1.isValidYear)(2024.5)).toBe(false);
            expect((0, validation_middleware_1.isValidYear)('2024.5')).toBe(false);
        });
        it('should return false for invalid year strings', () => {
            expect((0, validation_middleware_1.isValidYear)('not-a-year')).toBe(false);
            expect((0, validation_middleware_1.isValidYear)('202a')).toBe(false);
        });
    });
    describe('validatePaginationMiddleware', () => {
        it('should call next() on valid pagination params', () => {
            mockReq.query = { page: '1', pageSize: '10' };
            (0, validation_middleware_1.validatePaginationMiddleware)(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
        });
        it('should set default page to 1 if missing', () => {
            mockReq.query = { pageSize: '10' };
            (0, validation_middleware_1.validatePaginationMiddleware)(mockReq, mockRes, mockNext);
            expect(mockReq.query.page).toBe('1');
            expect(mockNext).toHaveBeenCalled();
        });
        it('should set default pageSize to 10 if missing', () => {
            mockReq.query = { page: '1' };
            (0, validation_middleware_1.validatePaginationMiddleware)(mockReq, mockRes, mockNext);
            expect(mockReq.query.pageSize).toBe('10');
            expect(mockNext).toHaveBeenCalled();
        });
        it('should enforce minimum page of 1', () => {
            mockReq.query = { page: '0', pageSize: '10' };
            (0, validation_middleware_1.validatePaginationMiddleware)(mockReq, mockRes, mockNext);
            expect(mockReq.query.page).toBe('1');
            expect(mockNext).toHaveBeenCalled();
        });
        it('should enforce minimum pageSize of 1', () => {
            mockReq.query = { page: '1', pageSize: '0' };
            (0, validation_middleware_1.validatePaginationMiddleware)(mockReq, mockRes, mockNext);
            expect(mockReq.query.pageSize).toBe('1');
            expect(mockNext).toHaveBeenCalled();
        });
        it('should enforce maximum pageSize of 100', () => {
            mockReq.query = { page: '1', pageSize: '1000' };
            (0, validation_middleware_1.validatePaginationMiddleware)(mockReq, mockRes, mockNext);
            expect(mockReq.query.pageSize).toBe('100');
            expect(mockNext).toHaveBeenCalled();
        });
        it('should handle negative page numbers', () => {
            mockReq.query = { page: '-5', pageSize: '10' };
            (0, validation_middleware_1.validatePaginationMiddleware)(mockReq, mockRes, mockNext);
            expect(mockReq.query.page).toBe('1');
            expect(mockNext).toHaveBeenCalled();
        });
        it('should handle negative pageSize', () => {
            mockReq.query = { page: '1', pageSize: '-50' };
            (0, validation_middleware_1.validatePaginationMiddleware)(mockReq, mockRes, mockNext);
            expect(mockReq.query.pageSize).toBe('1');
            expect(mockNext).toHaveBeenCalled();
        });
        it('should handle non-numeric page', () => {
            mockReq.query = { page: 'abc', pageSize: '10' };
            (0, validation_middleware_1.validatePaginationMiddleware)(mockReq, mockRes, mockNext);
            expect(mockReq.query.page).toBe('1');
            expect(mockNext).toHaveBeenCalled();
        });
        it('should handle non-numeric pageSize', () => {
            mockReq.query = { page: '1', pageSize: 'abc' };
            (0, validation_middleware_1.validatePaginationMiddleware)(mockReq, mockRes, mockNext);
            expect(mockReq.query.pageSize).toBe('10');
            expect(mockNext).toHaveBeenCalled();
        });
        it('should preserve other query parameters', () => {
            mockReq.query = { page: '1', pageSize: '10', search: 'test', sort: 'name' };
            (0, validation_middleware_1.validatePaginationMiddleware)(mockReq, mockRes, mockNext);
            expect(mockReq.query.search).toBe('test');
            expect(mockReq.query.sort).toBe('name');
            expect(mockNext).toHaveBeenCalled();
        });
    });
    describe('validateQueryParamsMiddleware', () => {
        it('should call next() on valid query params', () => {
            mockReq.query = { startDate: '2024-01-01', year: '2024' };
            (0, validation_middleware_1.validateQueryParamsMiddleware)(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
        });
        it('should reject invalid startDate format', () => {
            mockReq.query = { startDate: '01/01/2024' };
            (0, validation_middleware_1.validateQueryParamsMiddleware)(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
        });
        it('should reject invalid endDate format', () => {
            mockReq.query = { endDate: 'invalid-date' };
            (0, validation_middleware_1.validateQueryParamsMiddleware)(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
        });
        it('should accept valid date formats', () => {
            mockReq.query = {
                startDate: '2024-01-01',
                endDate: '2024-12-31',
            };
            (0, validation_middleware_1.validateQueryParamsMiddleware)(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalled();
        });
        it('should reject year below 1900', () => {
            mockReq.query = { year: '1800' };
            (0, validation_middleware_1.validateQueryParamsMiddleware)(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
        });
        it('should reject year above 2100', () => {
            mockReq.query = { year: '2200' };
            (0, validation_middleware_1.validateQueryParamsMiddleware)(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
        });
        it('should accept valid years in range', () => {
            const validYears = ['1900', '2000', '2024', '2100'];
            validYears.forEach(year => {
                mockNext.mockClear();
                mockRes.status = jest.fn().mockReturnThis();
                mockReq.query = { year };
                (0, validation_middleware_1.validateQueryParamsMiddleware)(mockReq, mockRes, mockNext);
                expect(mockNext).toHaveBeenCalled();
            });
        });
        it('should reject non-integer year', () => {
            mockReq.query = { year: '2024.5' };
            (0, validation_middleware_1.validateQueryParamsMiddleware)(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockNext).not.toHaveBeenCalled();
        });
        it('should allow missing parameters', () => {
            mockReq.query = {};
            (0, validation_middleware_1.validateQueryParamsMiddleware)(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalled();
        });
        it('should validate multiple parameters together', () => {
            mockReq.query = {
                startDate: '2024-01-01',
                endDate: '2024-12-31',
                year: '2024',
            };
            (0, validation_middleware_1.validateQueryParamsMiddleware)(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalled();
        });
        it('should reject if any parameter is invalid', () => {
            mockReq.query = {
                startDate: '2024-01-01',
                endDate: 'invalid',
                year: '2024',
            };
            (0, validation_middleware_1.validateQueryParamsMiddleware)(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockNext).not.toHaveBeenCalled();
        });
        it('should preserve other query parameters', () => {
            mockReq.query = {
                startDate: '2024-01-01',
                page: '1',
                search: 'test',
            };
            (0, validation_middleware_1.validateQueryParamsMiddleware)(mockReq, mockRes, mockNext);
            expect(mockReq.query.page).toBe('1');
            expect(mockReq.query.search).toBe('test');
            expect(mockNext).toHaveBeenCalled();
        });
        it('should provide helpful error messages', () => {
            mockReq.query = { startDate: 'invalid' };
            (0, validation_middleware_1.validateQueryParamsMiddleware)(mockReq, mockRes, mockNext);
            const errorCall = mockRes.json.mock.calls[0][0];
            expect(errorCall.error).toBeDefined();
            expect(typeof errorCall.error).toBe('string');
        });
    });
    describe('Middleware Order', () => {
        it('should validate pagination first (more strict)', () => {
            mockReq.query = { page: 'invalid', pageSize: 'invalid' };
            (0, validation_middleware_1.validatePaginationMiddleware)(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalled();
        });
        it('should validate query params second (more flexible)', () => {
            mockReq.query = { year: 'invalid' };
            (0, validation_middleware_1.validateQueryParamsMiddleware)(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(400);
        });
    });
    describe('Performance', () => {
        it('should validate quickly', () => {
            const start = Date.now();
            mockReq.query = { page: '1', pageSize: '10', startDate: '2024-01-01', year: '2024' };
            (0, validation_middleware_1.validatePaginationMiddleware)(mockReq, mockRes, mockNext);
            (0, validation_middleware_1.validateQueryParamsMiddleware)(mockReq, mockRes, mockNext);
            const duration = Date.now() - start;
            expect(duration).toBeLessThan(50);
        });
    });
    describe('Edge Cases', () => {
        it('should handle undefined query', () => {
            mockReq.query = undefined;
            expect(() => {
                (0, validation_middleware_1.validatePaginationMiddleware)(mockReq, mockRes, mockNext);
            }).not.toThrow();
        });
        it('should handle null query parameters', () => {
            mockReq.query = { page: null, pageSize: null };
            expect(() => {
                (0, validation_middleware_1.validatePaginationMiddleware)(mockReq, mockRes, mockNext);
            }).not.toThrow();
        });
        it('should handle extremely large page numbers', () => {
            mockReq.query = { page: '999999999', pageSize: '10' };
            (0, validation_middleware_1.validatePaginationMiddleware)(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalled();
        });
    });
    describe('Security', () => {
        it('should prevent SQL injection via page parameter', () => {
            mockReq.query = { page: "'; DROP TABLE users; --" };
            expect(() => {
                (0, validation_middleware_1.validatePaginationMiddleware)(mockReq, mockRes, mockNext);
            }).not.toThrow();
            expect(mockReq.query.page).toBe('1');
        });
        it('should prevent SQL injection via date parameter', () => {
            mockReq.query = { startDate: "2024-01-01'; DROP TABLE users; --" };
            (0, validation_middleware_1.validateQueryParamsMiddleware)(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(400);
        });
        it('should prevent XSS via parameters', () => {
            mockReq.query = { page: '<script>alert("xss")</script>' };
            expect(() => {
                (0, validation_middleware_1.validatePaginationMiddleware)(mockReq, mockRes, mockNext);
            }).not.toThrow();
            expect(mockReq.query.page).toBe('1');
        });
    });
});
//# sourceMappingURL=validation.middleware.test.js.map