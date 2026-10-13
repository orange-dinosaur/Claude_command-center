ALTER TABLE "title" ADD COLUMN "episodes" integer;--> statement-breakpoint
ALTER TABLE "title" ADD COLUMN "watched" integer DEFAULT 0 NOT NULL;