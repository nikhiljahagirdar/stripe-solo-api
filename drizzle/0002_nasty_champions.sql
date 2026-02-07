ALTER TABLE "rback_roles_pages" ALTER COLUMN "filters" SET DEFAULT '{"filters":[]}';--> statement-breakpoint
ALTER TABLE "rback_pages" ADD COLUMN "groupname" text NOT NULL DEFAULT 'General';