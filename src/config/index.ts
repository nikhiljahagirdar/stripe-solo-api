import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env['PORT'] ?? '3001'),
  nodeEnv: process.env['NODE_ENV'] ?? 'development',
  
  database: {
    url: process.env['DATABASE_URL'] ?? 'postgresql://postgres:postgres@localhost:5432/stripe_management',
    maxConnections: Number(process.env['DB_MAX_CONNECTIONS'] ?? '10'),
  },
  
  jwt: {
    secret: process.env['JWT_SECRET'] ?? 'your-secret-key',
    expiresIn: process.env['JWT_EXPIRES_IN'] ?? '24h',
  },
  
  encryption: {
    key: process.env['ENCRYPTION_KEY'] ?? 'your-encryption-key',
  },
  
  redis: {
    url: process.env['REDIS_URL'], // Optional - only use if provided
  },
  
  cors: {
    origin: process.env['CORS_ORIGIN']?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  },
  
  rateLimit: {
    windowMs: Number(process.env['RATE_LIMIT_WINDOW_MS'] ?? '1800000'), // 30 minutes
    max: Number(process.env['RATE_LIMIT_MAX'] ?? '100'),
  },
  
  logging: {
    level: process.env['LOG_LEVEL'] ?? 'info',
  },
};

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'ENCRYPTION_KEY'];

for (const envVar of requiredEnvVars) {
  if (typeof process.env[envVar] !== 'string' || process.env[envVar] === '') {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}