import express from 'express';
import { createServer } from 'http';
import { config } from './config';
//import { securityHeaders, rateLimiter } from './middleware/security';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import cors from 'cors';
import logger , {requestLogger} from './utils/logger';
import { compressionMiddleware } from './middleware/compression.middleware';
import { validatePaginationMiddleware, validateQueryParamsMiddleware } from './middleware/validation.middleware';
import { initializeSocketIO } from './services/socket.service';

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import rolesRoutes from './routes/roles.routes';
import keyRoutes from './routes/key.routes';
import customerRoutes from './routes/customer.routes';
import analyticsRoutes from './routes/analytics.routes';
import dashboardRoutes from './routes/dashboard.routes';
import accountRoutes from './routes/account.routes';
import paymentRoutes from './routes/payment.routes';
import healthRoutes from './routes/health.routes';
import invoiceRoutes from './routes/invoice.routes';
import subscriptionRoutes from './routes/subscription.routes';
import payoutRoutes from './routes/payout.routes';
import disputeRoutes from './routes/dispute.routes';
import taxRoutes from './routes/tax.routes';
import webhookRoutes from './routes/webhook.routes';
import balanceRoutes from './routes/balance.routes';
import chargeRoutes from './routes/charge.routes';
import refundRoutes from './routes/refund.routes';
import paymentMethodRoutes from './routes/paymentMethod.routes';
import couponRoutes from './routes/coupon.routes';
import checkoutRoutes from './routes/checkout.routes';
import paymentLinkRoutes from './routes/paymentLink.routes';
import connectRoutes from './routes/connect.routes';
import bankAccountRoutes from './routes/bankAccount.routes';
import cardRoutes from './routes/card.routes';
import promotionCodeRoutes from './routes/promotionCode.routes';
import fileRoutes from './routes/file.routes';
import eventRoutes from './routes/event.routes';
import priceRoutes from './routes/price.routes';
import productRoutes from './routes/product.routes';
import setupIntentRoutes from './routes/setupIntent.routes';
import mandateRoutes from './routes/mandate.routes';
import subscriptionItemRoutes from './routes/subscriptionItem.routes';
import transferRoutes from './routes/transfer.routes';
import invoiceItemRoutes from './routes/invoiceItem.routes';
import quoteRoutes from './routes/quote.routes';
import taxRateRoutes from './routes/taxRate.routes';
import shippingRateRoutes from './routes/shippingRate.routes';
import creditNoteRoutes from './routes/creditNote.routes';
import planRoutes from './routes/plan.routes';
import customerSessionRoutes from './routes/customerSession.routes';
import subscriptionScheduleRoutes from './routes/subscriptionSchedule.routes';
import applicationFeeRoutes from './routes/applicationFee.routes';
import topUpRoutes from './routes/topUp.routes';
import notificationRoutes from './routes/notification.routes';
import balanceTransactionRoutes from './routes/balanceTransaction.routes';
import fileLinkRoutes from './routes/fileLink.routes';
import taxCodeRoutes from './routes/taxCode.routes';
import cashBalanceRoutes from './routes/cashBalance.routes';
import testClockRoutes from './routes/testClock.routes';
import rbacPageRoutes from './routes/rbacPage.routes';
import settingsRoutes from './routes/settings.routes';
import userSettingsRoutes from './routes/userSettings.routes';
import expressJSDocSwagger from 'express-jsdoc-swagger';
import swaggerDef from './swaggerDef';

const app = express();

// Trust proxy for rate limiting and IP detection
app.set('trust proxy', 1);

// Swagger documentation
expressJSDocSwagger(app)(swaggerDef);

// Security middleware
//app.use(securityHeaders);
app.use(cors(config.cors));
//app.use(rateLimiter);
app.use(requestLogger);

// Performance middleware
app.use(compressionMiddleware);

// Webhook routes (before body parsing for raw body)
app.use('/api/v1/webhooks', webhookRoutes);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Query validation middleware
app.use(validatePaginationMiddleware);
app.use(validateQueryParamsMiddleware);

// Root route
app.get('/', (_req, res) => {
  res.status(200).json({
    message: 'Stripe Solo API is running',
    docs: '/api-docs',
    health: '/health',
    ready: '/ready'
  });
});

// Health check routes (no auth required)
app.use('/', healthRoutes);

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/roles', rolesRoutes);
app.use('/api/v1/keys', keyRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/accounts', accountRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/payouts', payoutRoutes);
app.use('/api/v1/disputes', disputeRoutes);
app.use('/api/v1/tax', taxRoutes);
app.use('/api/v1/balance', balanceRoutes);
app.use('/api/v1/charges', chargeRoutes);
app.use('/api/v1/refunds', refundRoutes);
app.use('/api/v1/payment-methods', paymentMethodRoutes);
app.use('/api/v1/coupons', couponRoutes);
app.use('/api/v1/checkout', checkoutRoutes);
app.use('/api/v1/payment-links', paymentLinkRoutes);
app.use('/api/v1/connect', connectRoutes);
app.use('/api/v1/bank-accounts', bankAccountRoutes);
app.use('/api/v1/cards', cardRoutes);
app.use('/api/v1/promotion-codes', promotionCodeRoutes);
app.use('/api/v1/files', fileRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/prices', priceRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/setup-intents', setupIntentRoutes);
app.use('/api/v1/mandates', mandateRoutes);
app.use('/api/v1/subscription-items', subscriptionItemRoutes);
app.use('/api/v1/transfers', transferRoutes);
app.use('/api/v1/invoice-items', invoiceItemRoutes);
app.use('/api/v1/quotes', quoteRoutes);
app.use('/api/v1/tax-rates', taxRateRoutes);
app.use('/api/v1/shipping-rates', shippingRateRoutes);
app.use('/api/v1/credit-notes', creditNoteRoutes);
app.use('/api/v1/plans', planRoutes);
app.use('/api/v1/customer-sessions', customerSessionRoutes);
app.use('/api/v1/subscription-schedules', subscriptionScheduleRoutes);
app.use('/api/v1/application-fees', applicationFeeRoutes);
app.use('/api/v1/top-ups', topUpRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/balance-transactions', balanceTransactionRoutes);
app.use('/api/v1/file-links', fileLinkRoutes);
app.use('/api/v1/tax-codes', taxCodeRoutes);
app.use('/api/v1/cash-balances', cashBalanceRoutes);
app.use('/api/v1/test-clocks', testClockRoutes);
app.use('/api/v1/rbac', rbacPageRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/user-settings', userSettingsRoutes);


// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO
initializeSocketIO(httpServer);

// Start server
httpServer.listen(config.port, () => {
  logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
  logger.info(`WebSocket server initialized on ws://localhost:${config.port}`);
});

// Process error handlers
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// // Graceful shutdown
// gracefulShutdown(server);

// Keep server alive
setInterval(() => {
  // Keep process alive
}, 60000);

export default app;