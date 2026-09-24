CREATE TABLE "title" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	"name" text NOT NULL,
	"author" text,
	"format" text,
	"season" integer,
	"status" text DEFAULT 'todo' NOT NULL,
	"start_date" date,
	"end_date" date,
	"rating" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "title_kind" CHECK ("title"."kind" in ('book', 'film', 'series')),
	CONSTRAINT "title_status" CHECK ("title"."status" in ('todo', 'doing', 'done')),
	CONSTRAINT "title_format" CHECK ("title"."format" in ('rigida', 'flessibile', 'ebook', 'audiolibro', 'biblioteca')),
	CONSTRAINT "title_rating" CHECK ("title"."rating" between 1 and 10),
	CONSTRAINT "title_end_after_start" CHECK ("title"."end_date" >= "title"."start_date")
);
--> statement-breakpoint
ALTER TABLE "title" ADD CONSTRAINT "title_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "title_user_id_kind_idx" ON "title" USING btree ("user_id","kind");