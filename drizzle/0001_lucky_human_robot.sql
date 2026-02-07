ALTER TABLE "rback_roles_pages" ADD COLUMN "filters" jsonb DEFAULT '{"filters":[]}';--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "is_read" boolean DEFAULT false;