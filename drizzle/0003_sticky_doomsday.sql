ALTER TABLE "rback_pages" ALTER COLUMN "groupname" SET DEFAULT 'General';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "parent_id" integer;