ALTER TABLE "application_fees" ALTER COLUMN "amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "application_fees" ALTER COLUMN "amount_refunded" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "application_fees" ALTER COLUMN "amount_refunded" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "balance" ALTER COLUMN "available" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "balance" ALTER COLUMN "pending" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "balance_transactions" ALTER COLUMN "amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "balance_transactions" ALTER COLUMN "fee" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "balance_transactions" ALTER COLUMN "net" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "cash_balance" ALTER COLUMN "available" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "cash_balance_transactions" ALTER COLUMN "amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "charges" ALTER COLUMN "amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "checkout_sessions" ALTER COLUMN "amount_total" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "coupons" ALTER COLUMN "amount_off" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "credit_notes" ALTER COLUMN "amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "customer_balance_transactions" ALTER COLUMN "amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "disputes" ALTER COLUMN "amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "invoice_items" ALTER COLUMN "amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "issuing_authorizations" ALTER COLUMN "amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "meter_events" ALTER COLUMN "value" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "payment_intents" ALTER COLUMN "amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "payouts" ALTER COLUMN "amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "plans" ALTER COLUMN "amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "prices" ALTER COLUMN "unit_amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "quotes" ALTER COLUMN "amount_total" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "refunds" ALTER COLUMN "amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "shipping_rates" ALTER COLUMN "fixed_amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "top_ups" ALTER COLUMN "amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "transfers" ALTER COLUMN "amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "treasury_accounts" ALTER COLUMN "balance" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "treasury_transactions" ALTER COLUMN "amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "rback_roles_pages" ADD COLUMN "isview" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "disputes" ADD COLUMN "stripe_account_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "stripe_account_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_intents" ADD COLUMN "payment_method_types" text;--> statement-breakpoint
ALTER TABLE "payment_intents" ADD COLUMN "payment_method_id" text;--> statement-breakpoint
ALTER TABLE "payment_intents" ADD COLUMN "confirmation_method" text;--> statement-breakpoint
ALTER TABLE "payment_intents" ADD COLUMN "capture_method" text;--> statement-breakpoint
ALTER TABLE "payment_intents" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "payment_intents" ADD COLUMN "receipt_email" text;--> statement-breakpoint
ALTER TABLE "payment_intents" ADD COLUMN "setup_future_usage" text;--> statement-breakpoint
ALTER TABLE "payment_intents" ADD COLUMN "client_secret" text;--> statement-breakpoint
ALTER TABLE "payment_intents" ADD COLUMN "metadata" text;--> statement-breakpoint
ALTER TABLE "prices" ADD COLUMN "stripe_account_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "stripe_account_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prices" ADD CONSTRAINT "prices_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "rback_roles_pages_role_id_idx" ON "rback_roles_pages" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "rback_roles_pages_userid_idx" ON "rback_roles_pages" USING btree ("userid");--> statement-breakpoint
CREATE INDEX "rback_roles_pages_page_id_idx" ON "rback_roles_pages" USING btree ("page_id");--> statement-breakpoint
CREATE INDEX "analytics_cache_account_id_idx" ON "analytics_cache" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "application_fees_user_id_idx" ON "application_fees" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "application_fees_stripe_account_id_idx" ON "application_fees" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "application_fees_stripe_charge_id_idx" ON "application_fees" USING btree ("stripe_charge_id");--> statement-breakpoint
CREATE INDEX "balance_user_id_idx" ON "balance" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "balance_stripe_account_id_idx" ON "balance" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "balance_transactions_user_id_idx" ON "balance_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "balance_transactions_stripe_account_id_idx" ON "balance_transactions" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "bank_accounts_user_id_idx" ON "bank_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bank_accounts_stripe_account_id_idx" ON "bank_accounts" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "bank_accounts_stripe_customer_id_idx" ON "bank_accounts" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "cards_user_id_idx" ON "cards" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cards_stripe_account_id_idx" ON "cards" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "cards_stripe_customer_id_idx" ON "cards" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "cash_balance_user_id_idx" ON "cash_balance" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cash_balance_stripe_account_id_idx" ON "cash_balance" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "cash_balance_stripe_customer_id_idx" ON "cash_balance" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "cash_balance_transactions_user_id_idx" ON "cash_balance_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cash_balance_transactions_stripe_account_id_idx" ON "cash_balance_transactions" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "cash_balance_transactions_stripe_customer_id_idx" ON "cash_balance_transactions" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "charges_user_id_idx" ON "charges" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "charges_stripe_account_id_idx" ON "charges" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "charges_stripe_customer_id_idx" ON "charges" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "checkout_sessions_user_id_idx" ON "checkout_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "checkout_sessions_stripe_account_id_idx" ON "checkout_sessions" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "checkout_sessions_stripe_customer_id_idx" ON "checkout_sessions" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "checkout_sessions_stripe_payment_intent_id_idx" ON "checkout_sessions" USING btree ("stripe_payment_intent_id");--> statement-breakpoint
CREATE INDEX "confirmation_tokens_user_id_idx" ON "confirmation_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "confirmation_tokens_stripe_account_id_idx" ON "confirmation_tokens" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "connect_accounts_user_id_idx" ON "connect_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "coupons_user_id_idx" ON "coupons" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "credit_notes_user_id_idx" ON "credit_notes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "credit_notes_stripe_account_id_idx" ON "credit_notes" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "credit_notes_stripe_invoice_id_idx" ON "credit_notes" USING btree ("stripe_invoice_id");--> statement-breakpoint
CREATE INDEX "credit_notes_stripe_customer_id_idx" ON "credit_notes" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "customer_balance_transactions_user_id_idx" ON "customer_balance_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "customer_balance_transactions_stripe_account_id_idx" ON "customer_balance_transactions" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "customer_balance_transactions_stripe_customer_id_idx" ON "customer_balance_transactions" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "customer_sessions_user_id_idx" ON "customer_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "customer_sessions_stripe_account_id_idx" ON "customer_sessions" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "customer_sessions_stripe_customer_id_idx" ON "customer_sessions" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "customers_user_id_idx" ON "customers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "customers_stripe_account_id_idx" ON "customers" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "disputes_user_id_idx" ON "disputes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "disputes_stripe_account_id_idx" ON "disputes" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "events_user_id_idx" ON "events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "events_stripe_account_id_idx" ON "events" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "file_links_user_id_idx" ON "file_links" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "file_links_stripe_account_id_idx" ON "file_links" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "files_user_id_idx" ON "files" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "files_stripe_account_id_idx" ON "files" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "financial_connections_accounts_user_id_idx" ON "financial_connections_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "financial_connections_accounts_stripe_account_id_idx" ON "financial_connections_accounts" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "invoice_items_user_id_idx" ON "invoice_items" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "invoice_items_stripe_account_id_idx" ON "invoice_items" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "invoice_items_stripe_invoice_id_idx" ON "invoice_items" USING btree ("stripe_invoice_id");--> statement-breakpoint
CREATE INDEX "invoice_items_stripe_customer_id_idx" ON "invoice_items" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "invoice_items_stripe_price_id_idx" ON "invoice_items" USING btree ("stripe_price_id");--> statement-breakpoint
CREATE INDEX "invoices_user_id_idx" ON "invoices" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "invoices_stripe_account_id_idx" ON "invoices" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "invoices_stripe_customer_id_idx" ON "invoices" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "issuing_authorizations_user_id_idx" ON "issuing_authorizations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "issuing_authorizations_stripe_account_id_idx" ON "issuing_authorizations" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "issuing_authorizations_stripe_issuing_card_id_idx" ON "issuing_authorizations" USING btree ("stripe_issuing_card_id");--> statement-breakpoint
CREATE INDEX "issuing_cardholders_user_id_idx" ON "issuing_cardholders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "issuing_cardholders_stripe_account_id_idx" ON "issuing_cardholders" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "issuing_cards_user_id_idx" ON "issuing_cards" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "issuing_cards_stripe_account_id_idx" ON "issuing_cards" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "issuing_cards_stripe_cardholder_id_idx" ON "issuing_cards" USING btree ("stripe_cardholder_id");--> statement-breakpoint
CREATE INDEX "mandates_user_id_idx" ON "mandates" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "mandates_stripe_account_id_idx" ON "mandates" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "mandates_stripe_customer_id_idx" ON "mandates" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "meter_events_user_id_idx" ON "meter_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "meter_events_stripe_account_id_idx" ON "meter_events" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "meter_events_stripe_meter_id_idx" ON "meter_events" USING btree ("stripe_meter_id");--> statement-breakpoint
CREATE INDEX "meters_user_id_idx" ON "meters" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "meters_stripe_account_id_idx" ON "meters" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payment_intents_user_id_idx" ON "payment_intents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payment_intents_stripe_account_id_idx" ON "payment_intents" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "payment_intents_stripe_customer_id_idx" ON "payment_intents" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "payment_links_user_id_idx" ON "payment_links" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payment_links_stripe_account_id_idx" ON "payment_links" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "payment_methods_user_id_idx" ON "payment_methods" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payment_methods_stripe_account_id_idx" ON "payment_methods" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "payment_methods_stripe_customer_id_idx" ON "payment_methods" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "payouts_user_id_idx" ON "payouts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payouts_stripe_account_id_idx" ON "payouts" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "plans_user_id_idx" ON "plans" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "plans_stripe_account_id_idx" ON "plans" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "plans_stripe_price_id_idx" ON "plans" USING btree ("stripe_price_id");--> statement-breakpoint
CREATE INDEX "prices_user_id_idx" ON "prices" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "prices_stripe_account_id_idx" ON "prices" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "prices_stripe_product_id_idx" ON "prices" USING btree ("stripe_product_id");--> statement-breakpoint
CREATE INDEX "products_user_id_idx" ON "products" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "promotion_codes_user_id_idx" ON "promotion_codes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "promotion_codes_stripe_coupon_id_idx" ON "promotion_codes" USING btree ("stripe_coupon_id");--> statement-breakpoint
CREATE INDEX "quotes_user_id_idx" ON "quotes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "quotes_stripe_account_id_idx" ON "quotes" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "quotes_stripe_customer_id_idx" ON "quotes" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "refunds_user_id_idx" ON "refunds" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "refunds_stripe_account_id_idx" ON "refunds" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "setup_attempts_user_id_idx" ON "setup_attempts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "setup_attempts_stripe_account_id_idx" ON "setup_attempts" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "setup_attempts_stripe_setup_intent_id_idx" ON "setup_attempts" USING btree ("stripe_setup_intent_id");--> statement-breakpoint
CREATE INDEX "setup_intents_user_id_idx" ON "setup_intents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "setup_intents_stripe_account_id_idx" ON "setup_intents" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "setup_intents_stripe_customer_id_idx" ON "setup_intents" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "shipping_codes_user_id_idx" ON "shipping_codes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "shipping_codes_stripe_account_id_idx" ON "shipping_codes" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "shipping_rates_user_id_idx" ON "shipping_rates" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "shipping_rates_stripe_account_id_idx" ON "shipping_rates" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "stripe_accounts_user_id_idx" ON "stripe_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "stripe_accounts_stripe_key_id_idx" ON "stripe_accounts" USING btree ("stripe_key_id");--> statement-breakpoint
CREATE INDEX "stripe_keys_user_id_idx" ON "stripe_keys" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscription_items_user_id_idx" ON "subscription_items" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscription_items_stripe_account_id_idx" ON "subscription_items" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "subscription_items_stripe_subscription_id_idx" ON "subscription_items" USING btree ("stripe_subscription_id");--> statement-breakpoint
CREATE INDEX "subscription_items_stripe_price_id_idx" ON "subscription_items" USING btree ("stripe_price_id");--> statement-breakpoint
CREATE INDEX "subscription_schedules_user_id_idx" ON "subscription_schedules" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscription_schedules_stripe_account_id_idx" ON "subscription_schedules" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "subscription_schedules_stripe_customer_id_idx" ON "subscription_schedules" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "subscription_schedules_stripe_subscription_id_idx" ON "subscription_schedules" USING btree ("stripe_subscription_id");--> statement-breakpoint
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscriptions_stripe_account_id_idx" ON "subscriptions" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "subscriptions_stripe_customer_id_idx" ON "subscriptions" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "tax_codes_user_id_idx" ON "tax_codes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tax_codes_stripe_account_id_idx" ON "tax_codes" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "tax_ids_user_id_idx" ON "tax_ids" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tax_ids_stripe_account_id_idx" ON "tax_ids" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "tax_ids_stripe_customer_id_idx" ON "tax_ids" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "tax_rates_user_id_idx" ON "tax_rates" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tax_rates_stripe_account_id_idx" ON "tax_rates" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "terminal_readers_user_id_idx" ON "terminal_readers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "terminal_readers_stripe_account_id_idx" ON "terminal_readers" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "test_clocks_user_id_idx" ON "test_clocks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "test_clocks_stripe_account_id_idx" ON "test_clocks" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "tokens_user_id_idx" ON "tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tokens_stripe_account_id_idx" ON "tokens" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "top_ups_user_id_idx" ON "top_ups" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "top_ups_stripe_account_id_idx" ON "top_ups" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "transfers_user_id_idx" ON "transfers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "transfers_stripe_account_id_idx" ON "transfers" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "treasury_accounts_user_id_idx" ON "treasury_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "treasury_accounts_stripe_account_id_idx" ON "treasury_accounts" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "treasury_transactions_user_id_idx" ON "treasury_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "treasury_transactions_stripe_account_id_idx" ON "treasury_transactions" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "treasury_transactions_stripe_treasury_account_id_idx" ON "treasury_transactions" USING btree ("stripe_treasury_account_id");--> statement-breakpoint
CREATE INDEX "users_role_id_idx" ON "users" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "users_settings_user_id_idx" ON "users_settings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "users_settings_setting_id_idx" ON "users_settings" USING btree ("setting_id");--> statement-breakpoint
CREATE INDEX "verification_sessions_user_id_idx" ON "verification_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_sessions_stripe_account_id_idx" ON "verification_sessions" USING btree ("stripe_account_id");--> statement-breakpoint
ALTER TABLE "stripe_keys" DROP COLUMN "encrypted_webhook_secret";