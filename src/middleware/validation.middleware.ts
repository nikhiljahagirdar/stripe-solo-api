import type { Request, Response, NextFunction } from 'express';

/**
 * Validate and sanitize pagination parameters
 * Prevents potential DoS attacks and optimizes queries
 */
export const validatePaginationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const { page = '1', pageSize = '10' } = req.query;

  try {
    const pageNum = Math.max(1, Number(page as string));
    const pageSizeNum = Math.max(1, Math.min(100, Number(pageSize as string)));

    // Store validated values back to query
    req.query['page'] = String(pageNum);
    req.query['pageSize'] = String(pageSizeNum);

    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid pagination parameters' });
  }
};

/**
 * Validate date format (YYYY-MM-DD)
 */
export function isValidDateString(dateString: string): boolean {
  if (!dateString) {return true;}
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) {return false;}
  
  const date = new Date(dateString);
  return date instanceof Date && !Number.isNaN(date.getTime());
}

/**
 * Validate year parameter
 */
export function isValidYear(year: unknown): boolean {
  if (!year) {return true;}
  const yearNum: number = typeof year === 'string' ? +(year) : (year as number);
  return yearNum === Math.floor(yearNum) && yearNum >= 1900 && yearNum <= 2100;
}

/**
 * Middleware to validate common query parameters
 */
export const validateQueryParamsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const { startDate, endDate, year } = req.query;

  if (startDate && !isValidDateString(startDate as string)) {
    res.status(400).json({ error: 'Invalid startDate format. Use YYYY-MM-DD' });
    return;
  }

  if (endDate && !isValidDateString(endDate as string)) {
    res.status(400).json({ error: 'Invalid endDate format. Use YYYY-MM-DD' });
    return;
  }

  if (year && !isValidYear(year)) {
    res.status(400).json({ error: 'Invalid year. Must be between 1900 and 2100' });
    return;
  }

  next();
};
