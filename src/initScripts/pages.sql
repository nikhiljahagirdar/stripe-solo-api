INSERT INTO rback_pages (pagename, pageurl) VALUES

-- =========================
-- 1. Authentication
-- =========================
('Login', '/auth/login'),
('Register', '/auth/register'),

-- =========================
-- 2. Dashboard & Analytics
-- =========================
('Dashboard Overview', '/dashboard'),
('Dashboard Analytics', '/analytics'),

-- =========================
-- 3. Stripe Accounts
-- =========================
('Accounts List', '/accounts'),
('Account Details', '/accounts/[id]'),
('Account Settings', '/accounts/[id]/settings'),
('Create Account', '/accounts/create'),

-- =========================
-- 4. Customers
-- =========================
('Customers List', '/customers'),
('Customer Details', '/customers/[id]'),
('Customer Payments', '/customers/[id]/payments'),
('Customer Subscriptions', '/customers/[id]/subscriptions'),
('Edit Customer', '/customers/[id]/edit'),
('Create Customer', '/customers/create'),

-- =========================
-- 5. Payments
-- =========================
('Payments List', '/payments'),
('Payment Details', '/payments/[id]'),
('Refund Payment', '/payments/[id]/refund'),
('Create Payment', '/payments/create'),
('Payment Methods', '/payments/methods'),
('Payment Method Details', '/payments/methods/[id]'),

-- =========================
-- 6. Subscriptions
-- =========================
('Subscriptions List', '/subscriptions'),
('Subscription Details', '/subscriptions/[id]'),
('Edit Subscription', '/subscriptions/[id]/edit'),
('Cancel Subscription', '/subscriptions/[id]/cancel'),
('Create Subscription', '/subscriptions/create'),
('Subscription Schedules', '/subscriptions/schedules'),
('Subscription Schedule Details', '/subscriptions/schedules/[id]'),

-- =========================
-- 7. Products & Pricing
-- =========================
('Products List', '/products'),
('Product Details', '/products/[id]'),
('Edit Product', '/products/[id]/edit'),
('Product Prices', '/products/[id]/prices'),
('Create Product Price', '/products/[id]/prices/create'),
('Create Product', '/products/create'),

-- =========================
-- 8. Invoices
-- =========================
('Invoices List', '/invoices'),
('Invoice Details', '/invoices/[id]'),
('Edit Invoice', '/invoices/[id]/edit'),
('Send Invoice', '/invoices/[id]/send'),
('Create Invoice', '/invoices/create'),
('Invoice Items', '/invoices/items'),
('Create Invoice Item', '/invoices/items/create'),

-- =========================
-- 9. Checkout & Payment Links
-- =========================
('Checkout Sessions', '/checkout/sessions'),
('Checkout Session Details', '/checkout/sessions/[id]'),
('Create Checkout Session', '/checkout/sessions/create'),
('Payment Links', '/checkout/payment-links'),
('Payment Link Details', '/checkout/payment-links/[id]'),
('Create Payment Link', '/checkout/payment-links/create'),

-- =========================
-- 10. Coupons & Promotions
-- =========================
('Coupons List', '/promotions/coupons'),
('Coupon Details', '/promotions/coupons/[id]'),
('Create Coupon', '/promotions/coupons/create'),
('Promotion Codes', '/promotions/codes'),
('Promotion Code Details', '/promotions/codes/[id]'),
('Create Promotion Code', '/promotions/codes/create'),

-- =========================
-- 11. Financial Management
-- =========================
('Account Balance', '/finance/balance'),
('Balance Transactions', '/finance/balance/transactions'),
('Payouts List', '/finance/payouts'),
('Payout Details', '/finance/payouts/[id]'),
('Refunds List', '/finance/refunds'),
('Refund Details', '/finance/refunds/[id]'),
('Disputes List', '/finance/disputes'),
('Dispute Details', '/finance/disputes/[id]'),

-- =========================
-- 12. Tax Management
-- =========================
('Tax Settings', '/tax/settings'),
('Tax Rates', '/tax/rates'),
('Tax Rate Details', '/tax/rates/[id]'),
('Create Tax Rate', '/tax/rates/create'),
('Tax Codes', '/tax/codes'),
('Tax Code Details', '/tax/codes/[id]'),

-- =========================
-- 13. Shipping
-- =========================
('Shipping Rates', '/shipping/rates'),
('Shipping Rate Details', '/shipping/rates/[id]'),
('Create Shipping Rate', '/shipping/rates/create'),

-- =========================
-- 14. Events & Webhooks
-- =========================
('Events List', '/events'),
('Event Details', '/events/[id]'),
('Webhook Endpoints', '/events/webhooks'),
('Webhook Details', '/events/webhooks/[id]'),
('Create Webhook', '/events/webhooks/create'),

-- =========================
-- 15. File Management
-- =========================
('Files List', '/files'),
('File Details', '/files/[id]'),
('Upload File', '/files/upload'),
('File Links', '/files/links'),
('Create File Link', '/files/links/create'),

-- =========================
-- 16. Settings & Configuration
-- =========================
('Settings Overview', '/settings'),
('User Profile', '/settings/profile'),
('Security Settings', '/settings/security'),
('Notification Settings', '/settings/notifications'),
('API Keys', '/settings/api-keys'),

-- =========================
-- 17. Reports & Analytics
-- =========================
('Revenue Reports', '/reports/revenue'),
('Customer Reports', '/reports/customers'),
('Payment Reports', '/reports/payments'),
('Subscription Reports', '/reports/subscriptions')

ON CONFLICT DO NOTHING;
