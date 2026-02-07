# Stripe Management API

A comprehensive multi-tenant Stripe management platform with PostgreSQL, authentication, and full CRUD operations.

## Features

- 🔐 JWT-based authentication with role-based access control
- 🏢 Multi-account support with encrypted API key storage
- 💳 Complete Stripe integration (customers, payments, subscriptions, etc.)
- 📊 Analytics and reporting
- 🔒 Security middleware (rate limiting, input validation, CORS)
- 📝 Comprehensive API documentation with Swagger
- 🐳 Docker support
- 📈 Structured logging and monitoring
- ✅ Health checks and graceful shutdown

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis (optional, for caching)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your configuration

5. Run database migrations:
   ```bash
   npm run db:migrate
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

### Docker Setup

```bash
docker-compose up -d
```

## API Documentation

Once running, visit:
- Swagger UI: `http://localhost:3001/api-docs`
- Health Check: `http://localhost:3001/health`

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start:prod` - Start production server
- `npm test` - Run tests
- `npm run test:coverage` - Run tests with coverage
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run database migrations

## Environment Variables

See `.env.example` for all available configuration options.

## Security

- Rate limiting (100 requests per 15 minutes by default)
- Input validation and sanitization
- Security headers via Helmet.js
- CORS configuration
- JWT token authentication
- Encrypted storage of sensitive data

## Monitoring

- Structured logging with Winston
- Health check endpoints
- Request correlation IDs
- Error tracking and reporting
- Performance metrics

## Testing

```bash
npm test                # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Generate coverage report
```

## Production Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Set production environment variables

3. Start the production server:
   ```bash
   npm run start:prod
   ```

## License

ISC