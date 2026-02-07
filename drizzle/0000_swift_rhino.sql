CREATE TABLE "rback_pages" (
	"id" serial PRIMARY KEY NOT NULL,
	"pagename" text NOT NULL,
	"pageurl" text NOT NULL,
	CONSTRAINT "rback_pages_pagename_unique" UNIQUE("pagename"),
	CONSTRAINT "rback_pages_pageurl_unique" UNIQUE("pageurl")
);
--> statement-breakpoint
CREATE TABLE "rback_roles_pages" (
	"id" serial PRIMARY KEY NOT NULL,
	"role_id" integer NOT NULL,
	"userid" integer,
	"page_id" integer NOT NULL,
	"isadd" boolean DEFAULT false,
	"isedit" boolean DEFAULT false,
	"isdelete" boolean DEFAULT false,
	"isupdate" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "analytics_cache" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer NOT NULL,
	"data" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_fees" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_account_id" integer NOT NULL,
	"stripe_application_fee_id" text NOT NULL,
	"stripe_charge_id" text,
	"amount" bigint,
	"currency" varchar(3),
	"amount_refunded" bigint DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "application_fees_stripe_application_fee_id_unique" UNIQUE("stripe_application_fee_id")
);
--> statement-breakpoint
CREATE TABLE "balance" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_account_id" integer NOT NULL,
	"available" bigint NOT NULL,
	"pending" bigint NOT NULL,
	"currency" varchar(3),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "balance_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_account_id" integer NOT NULL,
	"stripe_transaction_id" text NOT NULL,
	"type" text,
	"currency" varchar(3),
	"amount" bigint,
	"fee" bigint,
	"net" bigint,
	"status" text,
	"stripe_charge_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "balance_transactions_stripe_transaction_id_unique" UNIQUE("stripe_transaction_id")
);
--> statement-breakpoint
CREATE TABLE "bank_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_account_id" integer NOT NULL,
	"stripe_bank_account_id" text NOT NULL,
	"stripe_customer_id" text,
	"account_holder_name" text,
	"account_number" text,
	"routing_number" text,
	"country" varchar(2),
	"currency" varchar(3),
	"fingerprint" text,
	"status" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bank_accounts_stripe_bank_account_id_unique" UNIQUE("stripe_bank_account_id")
);
--> statement-breakpoint
CREATE TABLE "cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_account_id" integer NOT NULL,
	"stripe_card_id" text NOT NULL,
	"stripe_customer_id" text,
	"brand" text,
	"last4" varchar(4),
	"exp_month" integer,
	"exp_year" integer,
	"fingerprint" text,
	"country" varchar(2),
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cards_stripe_card_id_unique" UNIQUE("stripe_card_id")
);
--> statement-breakpoint
CREATE TABLE "cash_balance" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_account_id" integer NOT NULL,
	"stripe_customer_id" text NOT NULL,
	"available" bigint NOT NULL,
	"currency" varchar(3) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cash_balance_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_account_id" integer NOT NULL,
	"stripe_cash_transaction_id" text NOT NULL,
	"stripe_customer_id" text NOT NULL,
	"type" text,
	"amount" bigint,
	"currency" varchar(3),
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cash_balance_transactions_stripe_cash_transaction_id_unique" UNIQUE("stripe_cash_transaction_id")
);
--> statement-breakpoint
CREATE TABLE "charges" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_account_id" integer NOT NULL,
	"stripe_charge_id" text NOT NULL,
	"stripe_customer_id" text,
	"amount" bigint NOT NULL,
	"currency" varchar(3) NOT NULL,
	"status" text,
	"description" text,
	"paid" boolean DEFAULT false,
	"refunded" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "charges_stripe_charge_id_unique" UNIQUE("stripe_charge_id")
);
--> statement-breakpoint
CREATE TABLE "checkout_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_account_id" integer NOT NULL,
	"stripe_session_id" text NOT NULL,
	"stripe_customer_id" text,
	"stripe_payment_intent_id" text,
	"client_secret" text,
	"status" text,
	"url" text,
	"amount_total" bigint,
	"currency" varchar(3),
	"mode" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "checkout_sessions_stripe_session_id_unique" UNIQUE("stripe_session_id")
);
--> statement-breakpoint
CREATE TABLE "confirmation_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_account_id" integer NOT NULL,
	"stripe_token_id" text NOT NULL,
	"created" bigint,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "confirmation_tokens_stripe_token_id_unique" UNIQUE("stripe_token_id")
);
--> statement-breakpoint
CREATE TABLE "connect_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_connect_account_id" text NOT NULL,
	"type" text,
	"business_type" text,
	"country" varchar(2),
	"email" text,
	"charges_enabled" boolean DEFAULT false,
	"payouts_enabled" boolean DEFAULT false,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "connect_accounts_stripe_connect_account_id_unique" UNIQUE("stripe_connect_account_id")
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_coupon_id" text NOT NULL,
	"name" text,
	"amount_off" bigint,
	"percent_off" numeric(5, 2),
	"currency" varchar(3),
	"duration" text NOT NULL,
	"duration_in_months" integer,
	"max_redemptions" integer,
	"times_redeemed" integer DEFAULT 0 NOT NULL,
	"valid" boolean DEFAULT true NOT NULL,
	"redeem_by" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "coupons_stripe_coupon_id_unique" UNIQUE("stripe_coupon_id")
);
--> statement-breakpoint
CREATE TABLE "credit_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_account_id" integer NOT NULL,
	"stripe_credit_note_id" text NOT NULL,
	"stripe_invoice_id" text,
	"stripe_customer_id" text,
	"amount" bigint,
	"currency" varchar(3),
	"status" text,
	"reason" text,
	"memo" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "credit_notes_stripe_credit_note_id_unique" UNIQUE("stripe_credit_note_id")
);
--> statement-breakpoint
CREATE TABLE "customer_balance_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_account_id" integer NOT NULL,
	"stripe_balance_transaction_id" text NOT NULL,
	"stripe_customer_id" text NOT NULL,
	"type" text,
	"amount" bigint,
	"currency" varchar(3),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customer_balance_transactions_stripe_balance_transaction_id_unique" UNIQUE("stripe_balance_transaction_id")
);
--> statement-breakpoint
CREATE TABLE "customer_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_account_id" integer NOT NULL,
	"stripe_session_id" text NOT NULL,
	"stripe_customer_id" text,
	"client_secret" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customer_sessions_stripe_session_id_unique" UNIQUE("stripe_session_id")
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_account_id" integer NOT NULL,
	"stripe_customer_id" text NOT NULL,
	"email" text,
	"name" text,
	"livemode" boolean,
	"created" bigint,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customers_stripe_customer_id_unique" UNIQUE("stripe_customer_id")
);
--> statement-breakpoint
CREATE TABLE "disputes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_charge_id" text,
	"stripe_dispute_id" text NOT NULL,
	"amount" bigint NOT NULL,
	"currency" text NOT NULL,
	"reason" text,
	"status" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "disputes_stripe_dispute_id_unique" UNIQUE("stripe_dispute_id")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_account_id" integer NOT NULL,
	"stripe_event_id" text NOT NULL,
	"type" text NOT NULL,
	"api_version" text,
	"data" text,
	"created" bigint,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "events_stripe_event_id_unique" UNIQUE("stripe_event_id")
);
--> statement-breakpoint
CREATE TABLE "file_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_account_id" integer NOT NULL,
	"stripe_file_link_id" text NOT NULL,
	"stripe_file_id" text,
	"url" text,
	"expired" boolean DEFAULT false,
	"expires_at" timestamp,
	"created" bigint,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "file_links_stripe_file_link_id_unique" UNIQUE("stripe_file_link_id")
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_account_id" integer NOT NULL,
	"stripe_file_id" text NOT NULL,
	"filename" text,
	"purpose" text,
	"size" integer,
	"type" text,
	"created" bigint,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "files_stripe_file_id_unique" UNIQUE("stripe_file_id")
);
--> statement-breakpoint
CREATE TABLE "financial_connections_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_account_id" integer NOT NULL,
	"stripe_financial_account_id" text NOT NULL,
	"institution_name" text,
	"account_owner" text,
	"status" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "financial_connections_accounts_stripe_financial_account_id_unique" UNIQUE("stripe_financial_account_id")
);
--> statement-breakpoint
CREATE TABLE "invoice_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_account_id" integer NOT NULL,
	"stripe_invoice_item_id" text NOT NULL,
	"stripe_invoice_id" text,
	"stripe_customer_id" text,
	"stripe_price_id" text,
	"amount" bigint,
	"currency" varchar(3),
	"description" text,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoice_items_stripe_invoice_item_id_unique" UNIQUE("stripe_invoice_item_id")
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_customer_id" text,
	"stripe_invoice_id" text NOT NULL,
	"amount" bigint,
	"currency" text,
	"status" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_stripe_invoice_id_unique" UNIQUE("stripe_invoice_id")
);
--> statement-breakpoint
CREATE TABLE "issuing_authorizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_account_id" integer NOT NULL,
	"stripe_authorization_id" text NOT NULL,
	"stripe_issuing_card_id" text,
	"status" text,
	"amount" bigint,
	"currency" varchar(3),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "issuing_authorizations_stripe_authorization_id_unique" UNIQUE("stripe_authorization_id")
);
--> statement-breakpoint
CREATE TABLE "issuing_cardholders" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_account_id" integer NOT NULL,
	"stripe_cardholder_id" text NOT NULL,
	"name" text,
	"email" text,
	"status" text,
	"type" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "issuing_cardholders_stripe_cardholder_id_unique" UNIQUE("stripe_cardholder_id")
);
--> statement-breakpoint
CREATE TABLE "issuing_cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_account_id" integer NOT NULL,
	"stripe_issuing_card_id" text NOT NULL,
	"stripe_cardholder_id" text,
	"status" text,
	"type" text,
	"last4" varchar(4),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "issuing_cards_stripe_issuing_card_id_unique" UNIQUE("stripe_issuing_card_id")
);
--> statement-breakpoint
CREATE TABLE "mandates" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_account_id" integer NOT NULL,
	"stripe_mandate_id" text NOT NULL,
	"stripe_customer_id" text,
	"type" text,
	"status" text,
	"created" bigint,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mandates_stripe_mandate_id_unique" UNIQUE("stripe_mandate_id")
);
--> statement-breakpoint
CREATE TABLE "meter_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_account_id" integer NOT NULL,
	"stripe_meter_event_id" text NOT NULL,
	"stripe_meter_id" text,
	"value" numeric(12, 6),
	"timestamp" bigint,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "meter_events_stripe_meter_event_id_unique" UNIQUE("stripe_meter_event_id")
);
--> statement-breakpoint
CREATE TABLE "meters" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_account_id" integer NOT NULL,
	"stripe_meter_id" text NOT NULL,
	"event_name" text,
	"display_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "meters_stripe_meter_id_unique" UNIQUE("stripe_meter_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" text NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_intents" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_account_id" integer NOT NULL,
	"stripe_customer_id" text,
	"payment_intent_id" text NOT NULL,
	"amount" bigint NOT NULL,
	"currency" text NOT NULL,
	"status" text NOT NULL,
	"livemode" boolean,
	"created" bigint,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payment_intents_payment_intent_id_unique" UNIQUE("payment_intent_id")
);
--> statement-breakpoint
CREATE TABLE "payment_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_account_id" integer NOT NULL,
	"stripe_payment_link_id" text NOT NULL,
	"url" text,
	"active" boolean DEFAULT true,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payment_links_stripe_payment_link_id_unique" UNIQUE("stripe_payment_link_id")
);
--> statement-breakpoint
CREATE TABLE "payment_methods" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_account_id" integer NOT NULL,
	"stripe_payment_method_id" text NOT NULL,
	"type" text NOT NULL,
	"stripe_customer_id" text,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payment_methods_stripe_payment_method_id_unique" UNIQUE("stripe_payment_method_id")
);
--> statement-breakpoint
CREATE TABLE "payouts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_account_id" integer NOT NULL,
	"stripe_payout_id" text NOT NULL,
	"amount" bigint NOT NULL,
	"currency" varchar(3) NOT NULL,
	"status" text,
	"arrival_date" timestamp,
	"created" bigint,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payouts_stripe_payout_id_unique" UNIQUE("stripe_payout_id")
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_account_id" integer NOT NULL,
	"stripe_plan_id" text NOT NULL,
	"stripe_price_id" text,
	"amount" bigint,
	"currency" varchar(3),
	"interval" text,
	"interval_count" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "plans_stripe_plan_id_unique" UNIQUE("stripe_plan_id")
);
--> statement-breakpoint
CREATE TABLE "prices" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_product_id" text NOT NULL,
	"stripe_price_id" text NOT NULL,
	"unit_amount" bigint,
	"currency" text NOT NULL,
	"recurring_interval" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "prices_stripe_price_id_unique" UNIQUE("stripe_price_id")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_product_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_stripe_product_id_unique" UNIQUE("stripe_product_id")
);
--> statement-breakpoint
CREATE TABLE "promotion_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_promotion_code_id" text NOT NULL,
	"stripe_coupon_id" text NOT NULL,
	"code" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"max_redemptions" integer,
	"times_redeemed" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "promotion_codes_stripe_promotion_code_id_unique" UNIQUE("stripe_promotion_code_id")
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_account_id" integer NOT NULL,
	"stripe_quote_id" text NOT NULL,
	"stripe_customer_id" text,
	"status" text,
	"amount_total" bigint,
	"currency" varchar(3),
	"url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quotes_stripe_quote_id_unique" UNIQUE("stripe_quote_id")
);
--> statement-breakpoint
CREATE TABLE "refunds" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_account_id" integer NOT NULL,
	"stripe_refund_id" text NOT NULL,
	"stripe_charge_id" text,
	"amount" bigint NOT NULL,
	"currency" varchar(3) NOT NULL,
	"status" text,
	"reason" text,
	"created" bigint,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "refunds_stripe_refund_id_unique" UNIQUE("stripe_refund_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"settings_id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "setup_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_account_id" integer NOT NULL,
	"stripe_setup_attempt_id" text NOT NULL,
	"stripe_setup_intent_id" text,
	"status" text,
	"created" bigint,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "setup_attempts_stripe_setup_attempt_id_unique" UNIQUE("stripe_setup_attempt_id")
);
--> statement-breakpoint
CREATE TABLE "setup_intents" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_account_id" integer NOT NULL,
	"stripe_setup_intent_id" text NOT NULL,
	"stripe_customer_id" text,
	"status" text,
	"usage" text,
	"created" bigint,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "setup_intents_stripe_setup_intent_id_unique" UNIQUE("stripe_setup_intent_id")
);
--> statement-breakpoint
CREATE TABLE "shipping_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_account_id" integer NOT NULL,
	"stripe_shipping_code_id" text NOT NULL,
	"name" text,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shipping_codes_stripe_shipping_code_id_unique" UNIQUE("stripe_shipping_code_id")
);
--> statement-breakpoint
CREATE TABLE "shipping_rates" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_account_id" integer NOT NULL,
	"stripe_shipping_rate_id" text NOT NULL,
	"display_name" text,
	"fixed_amount" bigint,
	"currency" varchar(3),
	"delivery_estimate" text,
	"tax_behavior" text,
	"type" text,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shipping_rates_stripe_shipping_rate_id_unique" UNIQUE("stripe_shipping_rate_id")
);
--> statement-breakpoint
CREATE TABLE "stripe_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_key_id" integer NOT NULL,
	"stripe_account_id" text NOT NULL,
	"business_type" text,
	"country" varchar(2),
	"default_currency" varchar(3),
	"details_submitted" boolean DEFAULT false,
	"charges_enabled" boolean DEFAULT false,
	"payouts_enabled" boolean DEFAULT false,
	"email" text,
	"display_name" text,
	"business_profile_name" text,
	"business_profile_url" text,
	"type" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stripe_accounts_stripe_account_id_unique" UNIQUE("stripe_account_id")
);
--> statement-breakpoint
CREATE TABLE "stripe_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"encrypted_api_key" text,
	"encrypted_webhook_secret" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_account_id" integer NOT NULL,
	"stripe_subscription_item_id" text NOT NULL,
	"stripe_subscription_id" text,
	"stripe_price_id" text,
	"quantity" integer,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_items_stripe_subscription_item_id_unique" UNIQUE("stripe_subscription_item_id")
);
--> statement-breakpoint
CREATE TABLE "subscription_schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_account_id" integer NOT NULL,
	"stripe_schedule_id" text NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"status" text,
	"current_phase" integer,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_schedules_stripe_schedule_id_unique" UNIQUE("stripe_schedule_id")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text NOT NULL,
	"stripe_price_id" text NOT NULL,
	"status" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"current_period_start" timestamp NOT NULL,
	"current_period_end" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "tax_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_account_id" integer NOT NULL,
	"stripe_tax_code_id" text NOT NULL,
	"name" text,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tax_codes_stripe_tax_code_id_unique" UNIQUE("stripe_tax_code_id")
);
--> statement-breakpoint
CREATE TABLE "tax_ids" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_account_id" integer NOT NULL,
	"stripe_tax_id" text NOT NULL,
	"stripe_customer_id" text NOT NULL,
	"type" text,
	"value" text,
	"country" varchar(2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tax_ids_stripe_tax_id_unique" UNIQUE("stripe_tax_id")
);
--> statement-breakpoint
CREATE TABLE "tax_rates" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_account_id" integer NOT NULL,
	"stripe_tax_rate_id" text NOT NULL,
	"display_name" text,
	"jurisdiction" text,
	"country" varchar(2),
	"state" text,
	"percentage" numeric(5, 2),
	"inclusive" boolean DEFAULT false,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tax_rates_stripe_tax_rate_id_unique" UNIQUE("stripe_tax_rate_id")
);
--> statement-breakpoint
CREATE TABLE "tax_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer NOT NULL,
	"tax_mode" varchar(20) NOT NULL,
	"default_tax_code" varchar(50),
	"manual_tax_percent" numeric(5, 2),
	"require_address" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "tax_settings_account_id_unique" UNIQUE("account_id")
);
--> statement-breakpoint
CREATE TABLE "terminal_readers" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_account_id" integer NOT NULL,
	"stripe_reader_id" text NOT NULL,
	"label" text,
	"status" text,
	"location_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "terminal_readers_stripe_reader_id_unique" UNIQUE("stripe_reader_id")
);
--> statement-breakpoint
CREATE TABLE "test_clocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_account_id" integer NOT NULL,
	"stripe_clock_id" text NOT NULL,
	"frozen_time" bigint,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "test_clocks_stripe_clock_id_unique" UNIQUE("stripe_clock_id")
);
--> statement-breakpoint
CREATE TABLE "tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_account_id" integer NOT NULL,
	"stripe_token_id" text NOT NULL,
	"type" text,
	"created" bigint,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tokens_stripe_token_id_unique" UNIQUE("stripe_token_id")
);
--> statement-breakpoint
CREATE TABLE "top_ups" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_account_id" integer NOT NULL,
	"stripe_top_up_id" text NOT NULL,
	"amount" bigint,
	"currency" varchar(3),
	"status" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "top_ups_stripe_top_up_id_unique" UNIQUE("stripe_top_up_id")
);
--> statement-breakpoint
CREATE TABLE "transfers" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_account_id" integer NOT NULL,
	"stripe_transfer_id" text NOT NULL,
	"amount" bigint,
	"currency" varchar(3),
	"destination" text,
	"status" text,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "transfers_stripe_transfer_id_unique" UNIQUE("stripe_transfer_id")
);
--> statement-breakpoint
CREATE TABLE "treasury_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_account_id" integer NOT NULL,
	"stripe_treasury_account_id" text NOT NULL,
	"status" text,
	"currency" varchar(3),
	"balance" bigint,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "treasury_accounts_stripe_treasury_account_id_unique" UNIQUE("stripe_treasury_account_id")
);
--> statement-breakpoint
CREATE TABLE "treasury_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_account_id" integer NOT NULL,
	"stripe_treasury_transaction_id" text NOT NULL,
	"stripe_treasury_account_id" text,
	"type" text,
	"amount" bigint,
	"currency" varchar(3),
	"status" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "treasury_transactions_stripe_treasury_transaction_id_unique" UNIQUE("stripe_treasury_transaction_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role_id" integer NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "users_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"setting_id" integer NOT NULL,
	"value" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_account_id" integer NOT NULL,
	"stripe_session_id" text NOT NULL,
	"status" text,
	"type" text,
	"url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "verification_sessions_stripe_session_id_unique" UNIQUE("stripe_session_id")
);
--> statement-breakpoint
ALTER TABLE "rback_roles_pages" ADD CONSTRAINT "rback_roles_pages_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rback_roles_pages" ADD CONSTRAINT "rback_roles_pages_userid_users_id_fk" FOREIGN KEY ("userid") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rback_roles_pages" ADD CONSTRAINT "rback_roles_pages_page_id_rback_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."rback_pages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_cache" ADD CONSTRAINT "analytics_cache_account_id_stripe_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_fees" ADD CONSTRAINT "application_fees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_fees" ADD CONSTRAINT "application_fees_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_fees" ADD CONSTRAINT "application_fees_stripe_charge_id_charges_stripe_charge_id_fk" FOREIGN KEY ("stripe_charge_id") REFERENCES "public"."charges"("stripe_charge_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "balance" ADD CONSTRAINT "balance_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "balance" ADD CONSTRAINT "balance_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "balance_transactions" ADD CONSTRAINT "balance_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "balance_transactions" ADD CONSTRAINT "balance_transactions_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_stripe_customer_id_customers_stripe_customer_id_fk" FOREIGN KEY ("stripe_customer_id") REFERENCES "public"."customers"("stripe_customer_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_stripe_customer_id_customers_stripe_customer_id_fk" FOREIGN KEY ("stripe_customer_id") REFERENCES "public"."customers"("stripe_customer_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_balance" ADD CONSTRAINT "cash_balance_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_balance" ADD CONSTRAINT "cash_balance_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_balance" ADD CONSTRAINT "cash_balance_stripe_customer_id_customers_stripe_customer_id_fk" FOREIGN KEY ("stripe_customer_id") REFERENCES "public"."customers"("stripe_customer_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_balance_transactions" ADD CONSTRAINT "cash_balance_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_balance_transactions" ADD CONSTRAINT "cash_balance_transactions_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_balance_transactions" ADD CONSTRAINT "cash_balance_transactions_stripe_customer_id_customers_stripe_customer_id_fk" FOREIGN KEY ("stripe_customer_id") REFERENCES "public"."customers"("stripe_customer_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charges" ADD CONSTRAINT "charges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charges" ADD CONSTRAINT "charges_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charges" ADD CONSTRAINT "charges_stripe_customer_id_customers_stripe_customer_id_fk" FOREIGN KEY ("stripe_customer_id") REFERENCES "public"."customers"("stripe_customer_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_sessions" ADD CONSTRAINT "checkout_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_sessions" ADD CONSTRAINT "checkout_sessions_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_sessions" ADD CONSTRAINT "checkout_sessions_stripe_customer_id_customers_stripe_customer_id_fk" FOREIGN KEY ("stripe_customer_id") REFERENCES "public"."customers"("stripe_customer_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_sessions" ADD CONSTRAINT "checkout_sessions_stripe_payment_intent_id_payment_intents_payment_intent_id_fk" FOREIGN KEY ("stripe_payment_intent_id") REFERENCES "public"."payment_intents"("payment_intent_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "confirmation_tokens" ADD CONSTRAINT "confirmation_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "confirmation_tokens" ADD CONSTRAINT "confirmation_tokens_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connect_accounts" ADD CONSTRAINT "connect_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_stripe_invoice_id_invoices_stripe_invoice_id_fk" FOREIGN KEY ("stripe_invoice_id") REFERENCES "public"."invoices"("stripe_invoice_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_stripe_customer_id_customers_stripe_customer_id_fk" FOREIGN KEY ("stripe_customer_id") REFERENCES "public"."customers"("stripe_customer_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_balance_transactions" ADD CONSTRAINT "customer_balance_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_balance_transactions" ADD CONSTRAINT "customer_balance_transactions_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_balance_transactions" ADD CONSTRAINT "customer_balance_transactions_stripe_customer_id_customers_stripe_customer_id_fk" FOREIGN KEY ("stripe_customer_id") REFERENCES "public"."customers"("stripe_customer_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_sessions" ADD CONSTRAINT "customer_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_sessions" ADD CONSTRAINT "customer_sessions_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_sessions" ADD CONSTRAINT "customer_sessions_stripe_customer_id_customers_stripe_customer_id_fk" FOREIGN KEY ("stripe_customer_id") REFERENCES "public"."customers"("stripe_customer_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_links" ADD CONSTRAINT "file_links_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_links" ADD CONSTRAINT "file_links_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_connections_accounts" ADD CONSTRAINT "financial_connections_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_connections_accounts" ADD CONSTRAINT "financial_connections_accounts_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_stripe_invoice_id_invoices_stripe_invoice_id_fk" FOREIGN KEY ("stripe_invoice_id") REFERENCES "public"."invoices"("stripe_invoice_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_stripe_customer_id_customers_stripe_customer_id_fk" FOREIGN KEY ("stripe_customer_id") REFERENCES "public"."customers"("stripe_customer_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_stripe_price_id_prices_stripe_price_id_fk" FOREIGN KEY ("stripe_price_id") REFERENCES "public"."prices"("stripe_price_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_stripe_customer_id_customers_stripe_customer_id_fk" FOREIGN KEY ("stripe_customer_id") REFERENCES "public"."customers"("stripe_customer_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issuing_authorizations" ADD CONSTRAINT "issuing_authorizations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issuing_authorizations" ADD CONSTRAINT "issuing_authorizations_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issuing_authorizations" ADD CONSTRAINT "issuing_authorizations_stripe_issuing_card_id_issuing_cards_stripe_issuing_card_id_fk" FOREIGN KEY ("stripe_issuing_card_id") REFERENCES "public"."issuing_cards"("stripe_issuing_card_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issuing_cardholders" ADD CONSTRAINT "issuing_cardholders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issuing_cardholders" ADD CONSTRAINT "issuing_cardholders_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issuing_cards" ADD CONSTRAINT "issuing_cards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issuing_cards" ADD CONSTRAINT "issuing_cards_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issuing_cards" ADD CONSTRAINT "issuing_cards_stripe_cardholder_id_issuing_cardholders_stripe_cardholder_id_fk" FOREIGN KEY ("stripe_cardholder_id") REFERENCES "public"."issuing_cardholders"("stripe_cardholder_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mandates" ADD CONSTRAINT "mandates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mandates" ADD CONSTRAINT "mandates_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mandates" ADD CONSTRAINT "mandates_stripe_customer_id_customers_stripe_customer_id_fk" FOREIGN KEY ("stripe_customer_id") REFERENCES "public"."customers"("stripe_customer_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meter_events" ADD CONSTRAINT "meter_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meter_events" ADD CONSTRAINT "meter_events_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meter_events" ADD CONSTRAINT "meter_events_stripe_meter_id_meters_stripe_meter_id_fk" FOREIGN KEY ("stripe_meter_id") REFERENCES "public"."meters"("stripe_meter_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meters" ADD CONSTRAINT "meters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meters" ADD CONSTRAINT "meters_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_intents" ADD CONSTRAINT "payment_intents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_intents" ADD CONSTRAINT "payment_intents_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_intents" ADD CONSTRAINT "payment_intents_stripe_customer_id_customers_stripe_customer_id_fk" FOREIGN KEY ("stripe_customer_id") REFERENCES "public"."customers"("stripe_customer_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_links" ADD CONSTRAINT "payment_links_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_links" ADD CONSTRAINT "payment_links_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_stripe_customer_id_customers_stripe_customer_id_fk" FOREIGN KEY ("stripe_customer_id") REFERENCES "public"."customers"("stripe_customer_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plans" ADD CONSTRAINT "plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plans" ADD CONSTRAINT "plans_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plans" ADD CONSTRAINT "plans_stripe_price_id_prices_stripe_price_id_fk" FOREIGN KEY ("stripe_price_id") REFERENCES "public"."prices"("stripe_price_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prices" ADD CONSTRAINT "prices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prices" ADD CONSTRAINT "prices_stripe_product_id_products_stripe_product_id_fk" FOREIGN KEY ("stripe_product_id") REFERENCES "public"."products"("stripe_product_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_codes" ADD CONSTRAINT "promotion_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_codes" ADD CONSTRAINT "promotion_codes_stripe_coupon_id_coupons_stripe_coupon_id_fk" FOREIGN KEY ("stripe_coupon_id") REFERENCES "public"."coupons"("stripe_coupon_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_stripe_customer_id_customers_stripe_customer_id_fk" FOREIGN KEY ("stripe_customer_id") REFERENCES "public"."customers"("stripe_customer_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setup_attempts" ADD CONSTRAINT "setup_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setup_attempts" ADD CONSTRAINT "setup_attempts_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setup_attempts" ADD CONSTRAINT "setup_attempts_stripe_setup_intent_id_setup_intents_stripe_setup_intent_id_fk" FOREIGN KEY ("stripe_setup_intent_id") REFERENCES "public"."setup_intents"("stripe_setup_intent_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setup_intents" ADD CONSTRAINT "setup_intents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setup_intents" ADD CONSTRAINT "setup_intents_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setup_intents" ADD CONSTRAINT "setup_intents_stripe_customer_id_customers_stripe_customer_id_fk" FOREIGN KEY ("stripe_customer_id") REFERENCES "public"."customers"("stripe_customer_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_codes" ADD CONSTRAINT "shipping_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_codes" ADD CONSTRAINT "shipping_codes_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_rates" ADD CONSTRAINT "shipping_rates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_rates" ADD CONSTRAINT "shipping_rates_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stripe_accounts" ADD CONSTRAINT "stripe_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stripe_accounts" ADD CONSTRAINT "stripe_accounts_stripe_key_id_stripe_keys_id_fk" FOREIGN KEY ("stripe_key_id") REFERENCES "public"."stripe_keys"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stripe_keys" ADD CONSTRAINT "stripe_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_items" ADD CONSTRAINT "subscription_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_items" ADD CONSTRAINT "subscription_items_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_items" ADD CONSTRAINT "subscription_items_stripe_subscription_id_subscriptions_stripe_subscription_id_fk" FOREIGN KEY ("stripe_subscription_id") REFERENCES "public"."subscriptions"("stripe_subscription_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_items" ADD CONSTRAINT "subscription_items_stripe_price_id_prices_stripe_price_id_fk" FOREIGN KEY ("stripe_price_id") REFERENCES "public"."prices"("stripe_price_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_schedules" ADD CONSTRAINT "subscription_schedules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_schedules" ADD CONSTRAINT "subscription_schedules_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_schedules" ADD CONSTRAINT "subscription_schedules_stripe_customer_id_customers_stripe_customer_id_fk" FOREIGN KEY ("stripe_customer_id") REFERENCES "public"."customers"("stripe_customer_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_schedules" ADD CONSTRAINT "subscription_schedules_stripe_subscription_id_subscriptions_stripe_subscription_id_fk" FOREIGN KEY ("stripe_subscription_id") REFERENCES "public"."subscriptions"("stripe_subscription_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_stripe_customer_id_customers_stripe_customer_id_fk" FOREIGN KEY ("stripe_customer_id") REFERENCES "public"."customers"("stripe_customer_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_codes" ADD CONSTRAINT "tax_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_codes" ADD CONSTRAINT "tax_codes_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_ids" ADD CONSTRAINT "tax_ids_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_ids" ADD CONSTRAINT "tax_ids_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_ids" ADD CONSTRAINT "tax_ids_stripe_customer_id_customers_stripe_customer_id_fk" FOREIGN KEY ("stripe_customer_id") REFERENCES "public"."customers"("stripe_customer_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_rates" ADD CONSTRAINT "tax_rates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_rates" ADD CONSTRAINT "tax_rates_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_settings" ADD CONSTRAINT "tax_settings_account_id_stripe_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terminal_readers" ADD CONSTRAINT "terminal_readers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terminal_readers" ADD CONSTRAINT "terminal_readers_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_clocks" ADD CONSTRAINT "test_clocks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_clocks" ADD CONSTRAINT "test_clocks_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "top_ups" ADD CONSTRAINT "top_ups_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "top_ups" ADD CONSTRAINT "top_ups_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury_accounts" ADD CONSTRAINT "treasury_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury_accounts" ADD CONSTRAINT "treasury_accounts_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury_transactions" ADD CONSTRAINT "treasury_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury_transactions" ADD CONSTRAINT "treasury_transactions_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury_transactions" ADD CONSTRAINT "treasury_transactions_stripe_treasury_account_id_treasury_accounts_stripe_treasury_account_id_fk" FOREIGN KEY ("stripe_treasury_account_id") REFERENCES "public"."treasury_accounts"("stripe_treasury_account_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_settings" ADD CONSTRAINT "users_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_settings" ADD CONSTRAINT "users_settings_setting_id_settings_settings_id_fk" FOREIGN KEY ("setting_id") REFERENCES "public"."settings"("settings_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_sessions" ADD CONSTRAINT "verification_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_sessions" ADD CONSTRAINT "verification_sessions_stripe_account_id_stripe_accounts_id_fk" FOREIGN KEY ("stripe_account_id") REFERENCES "public"."stripe_accounts"("id") ON DELETE no action ON UPDATE no action;