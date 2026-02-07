import type { Request, Response} from 'express';
import { NextFunction } from 'express';
import {
  validatePaginationMiddleware,
  validateQueryParamsMiddleware,
  isValidDateString,
  isValidYear,
} from '../../src/middleware/validation.middleware';

describe('Validation Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

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
      expect(isValidDateString('2024-01-15')).toBe(true);
      expect(isValidDateString('2024-12-31')).toBe(true);
      expect(isValidDateString('2000-06-15')).toBe(true);
    });

    it('should return true for ISO 8601 format', () => {
      expect(isValidDateString('2024-01-15T00:00:00Z')).toBe(true);
      expect(isValidDateString('2024-01-15T12:30:45Z')).toBe(true);
    });

    it('should return true for empty string', () => {
      expect(isValidDateString('')).toBe(true);
    });

    it('should return false for invalid format', () => {
      expect(isValidDateString('01/15/2024')).toBe(false);
      expect(isValidDateString('15-01-2024')).toBe(false);
      expect(isValidDateString('2024/01/15')).toBe(false);
    });

    it('should return false for invalid date', () => {
      expect(isValidDateString('2024-13-01')).toBe(false); // Month 13
      expect(isValidDateString('2024-01-32')).toBe(false); // Day 32
      expect(isValidDateString('2024-02-30')).toBe(false); // Feb 30
    });

    it('should return false for malformed date', () => {
      expect(isValidDateString('2024-1-15')).toBe(false); // Missing leading zero
      expect(isValidDateString('not-a-date')).toBe(false);
      expect(isValidDateString('2024')).toBe(false);
    });

    it('should return false for null or undefined (treated as string)', () => {
      expect(isValidDateString(null as any)).toBe(false);
      expect(isValidDateString(undefined as any)).toBe(false);
    });
  });

  describe('isValidYear', () => {
    it('should return true for valid years', () => {
      expect(isValidYear(2020)).toBe(true);
      expect(isValidYear(2024)).toBe(true);
      expect(isValidYear(2025)).toBe(true);
      expect(isValidYear(1900)).toBe(true);
      expect(isValidYear(2100)).toBe(true);
    });

    it('should return true for valid year strings', () => {
      expect(isValidYear('2024')).toBe(true);
      expect(isValidYear('2020')).toBe(true);
    });

    it('should return true for empty/undefined', () => {
      expect(isValidYear(undefined)).toBe(true);
      expect(isValidYear(null)).toBe(true);
      expect(isValidYear('')).toBe(true);
    });

    it('should return false for years before 1900', () => {
      expect(isValidYear(1899)).toBe(false);
      expect(isValidYear(1800)).toBe(false);
    });

    it('should return false for years after 2100', () => {
      expect(isValidYear(2101)).toBe(false);
      expect(isValidYear(3000)).toBe(false);
    });

    it('should return false for non-integer years', () => {
      expect(isValidYear(2024.5)).toBe(false);
      expect(isValidYear('2024.5')).toBe(false);
    });

    it('should return false for invalid year strings', () => {
      expect(isValidYear('not-a-year')).toBe(false);
      expect(isValidYear('202a')).toBe(false);
    });
  });

  describe('validatePaginationMiddleware', () => {
    it('should call next() on valid pagination params', () => {
      mockReq.query = { page: '1', pageSize: '10' };

      validatePaginationMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should set default page to 1 if missing', () => {
      mockReq.query = { pageSize: '10' };

      validatePaginationMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.query.page).toBe('1');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should set default pageSize to 10 if missing', () => {
      mockReq.query = { page: '1' };

      validatePaginationMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.query.pageSize).toBe('10');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should enforce minimum page of 1', () => {
      mockReq.query = { page: '0', pageSize: '10' };

      validatePaginationMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.query.page).toBe('1');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should enforce minimum pageSize of 1', () => {
      mockReq.query = { page: '1', pageSize: '0' };

      validatePaginationMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.query.pageSize).toBe('1');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should enforce maximum pageSize of 100', () => {
      mockReq.query = { page: '1', pageSize: '1000' };

      validatePaginationMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.query.pageSize).toBe('100');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle negative page numbers', () => {
      mockReq.query = { page: '-5', pageSize: '10' };

      validatePaginationMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.query.page).toBe('1');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle negative pageSize', () => {
      mockReq.query = { page: '1', pageSize: '-50' };

      validatePaginationMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.query.pageSize).toBe('1');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle non-numeric page', () => {
      mockReq.query = { page: 'abc', pageSize: '10' };

      validatePaginationMiddleware(mockReq as Request, mockRes as Response, mockNext);

      // Should default to 1 on NaN
      expect(mockReq.query.page).toBe('1');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle non-numeric pageSize', () => {
      mockReq.query = { page: '1', pageSize: 'abc' };

      validatePaginationMiddleware(mockReq as Request, mockRes as Response, mockNext);

      // Should default to 10 on NaN
      expect(mockReq.query.pageSize).toBe('10');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should preserve other query parameters', () => {
      mockReq.query = { page: '1', pageSize: '10', search: 'test', sort: 'name' };

      validatePaginationMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.query.search).toBe('test');
      expect(mockReq.query.sort).toBe('name');
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('validateQueryParamsMiddleware', () => {
    it('should call next() on valid query params', () => {
      mockReq.query = { startDate: '2024-01-01', year: '2024' };

      validateQueryParamsMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should reject invalid startDate format', () => {
      mockReq.query = { startDate: '01/01/2024' };

      validateQueryParamsMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject invalid endDate format', () => {
      mockReq.query = { endDate: 'invalid-date' };

      validateQueryParamsMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should accept valid date formats', () => {
      mockReq.query = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      validateQueryParamsMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject year below 1900', () => {
      mockReq.query = { year: '1800' };

      validateQueryParamsMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject year above 2100', () => {
      mockReq.query = { year: '2200' };

      validateQueryParamsMiddleware(mockReq as Request, mockRes as Response, mockNext);

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

        validateQueryParamsMiddleware(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalled();
      });
    });

    it('should reject non-integer year', () => {
      mockReq.query = { year: '2024.5' };

      validateQueryParamsMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow missing parameters', () => {
      mockReq.query = {};

      validateQueryParamsMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should validate multiple parameters together', () => {
      mockReq.query = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        year: '2024',
      };

      validateQueryParamsMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject if any parameter is invalid', () => {
      mockReq.query = {
        startDate: '2024-01-01', // Valid
        endDate: 'invalid', // Invalid
        year: '2024', // Valid
      };

      validateQueryParamsMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should preserve other query parameters', () => {
      mockReq.query = {
        startDate: '2024-01-01',
        page: '1',
        search: 'test',
      };

      validateQueryParamsMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.query.page).toBe('1');
      expect(mockReq.query.search).toBe('test');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should provide helpful error messages', () => {
      mockReq.query = { startDate: 'invalid' };

      validateQueryParamsMiddleware(mockReq as Request, mockRes as Response, mockNext);

      const errorCall = (mockRes.json as jest.Mock).mock.calls[0][0];
      expect(errorCall.error).toBeDefined();
      expect(typeof errorCall.error).toBe('string');
    });
  });

  describe('Middleware Order', () => {
    it('should validate pagination first (more strict)', () => {
      mockReq.query = { page: 'invalid', pageSize: 'invalid' };

      validatePaginationMiddleware(mockReq as Request, mockRes as Response, mockNext);

      // Should still process (with defaults)
      expect(mockNext).toHaveBeenCalled();
    });

    it('should validate query params second (more flexible)', () => {
      mockReq.query = { year: 'invalid' };

      validateQueryParamsMiddleware(mockReq as Request, mockRes as Response, mockNext);

      // Should reject
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Performance', () => {
    it('should validate quickly', () => {
      const start = Date.now();

      mockReq.query = { page: '1', pageSize: '10', startDate: '2024-01-01', year: '2024' };

      validatePaginationMiddleware(mockReq as Request, mockRes as Response, mockNext);
      validateQueryParamsMiddleware(mockReq as Request, mockRes as Response, mockNext);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(50); // Should be very fast
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined query', () => {
      mockReq.query = undefined;

      expect(() => {
        validatePaginationMiddleware(mockReq as Request, mockRes as Response, mockNext);
      }).not.toThrow();
    });

    it('should handle null query parameters', () => {
      mockReq.query = { page: null as any, pageSize: null as any };

      expect(() => {
        validatePaginationMiddleware(mockReq as Request, mockRes as Response, mockNext);
      }).not.toThrow();
    });

    it('should handle extremely large page numbers', () => {
      mockReq.query = { page: '999999999', pageSize: '10' };

      validatePaginationMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Security', () => {
    it('should prevent SQL injection via page parameter', () => {
      mockReq.query = { page: "'; DROP TABLE users; --" };

      expect(() => {
        validatePaginationMiddleware(mockReq as Request, mockRes as Response, mockNext);
      }).not.toThrow();

      // Should normalize to number
      expect(mockReq.query.page).toBe('1');
    });

    it('should prevent SQL injection via date parameter', () => {
      mockReq.query = { startDate: "2024-01-01'; DROP TABLE users; --" };

      validateQueryParamsMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should prevent XSS via parameters', () => {
      mockReq.query = { page: '<script>alert("xss")</script>' };

      expect(() => {
        validatePaginationMiddleware(mockReq as Request, mockRes as Response, mockNext);
      }).not.toThrow();

      // Should normalize
      expect(mockReq.query.page).toBe('1');
    });
  });
});
