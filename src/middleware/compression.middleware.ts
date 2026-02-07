import type { Request, Response } from 'express';
import compression from 'compression';

/**
 * Enable gzip compression for response bodies larger than 1KB
 * Reduces bandwidth and speeds up API responses by up to 80%
 */
export const compressionMiddleware = compression({
  level: 6, // Balance between compression ratio and speed
  threshold: 1024, // Only compress responses larger than 1KB
  filter: (req: Request, res: Response) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
});
