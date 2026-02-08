import winston from 'winston';
import type { Request, Response, NextFunction } from 'express';

const logger = winston.createLogger({
  level: process.env['LOG_LEVEL'] ?? 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'stripe-management-api' },
  transports: [],
});

logger.add(new winston.transports.Console({
  format: winston.format.simple()
}));

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const correlationId = req.headers['x-correlation-id'] || `req-${Date.now()}-${Math.random()}`;
  
  req.correlationId = correlationId as string;
  res.setHeader('x-correlation-id', correlationId);

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      correlationId: req.correlationId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  });

  next();
};

export const auditLogger = (action: string, userId: number, details: unknown) => {
  logger.info('Audit Log', {
    action,
    userId,
    details,
    timestamp: new Date().toISOString()
  });
};

export default logger;