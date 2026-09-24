CREATE TABLE "closeout_item" (
	"id" text PRIMARY KEY NOT NULL,
	"month_id" text NOT NULL,
	"area" text NOT NULL,
	"text" text NOT NULL,
	"done" boolean DEFAULT false NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "closeout_month" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "closeout_month_user_id_year_month_unique" UNIQUE("user_id","year","month")
);
--> statement-breakpoint
ALTER TABLE "closeout_item" ADD CONSTRAINT "closeout_item_month_id_closeout_month_id_fk" FOREIGN KEY ("month_id") REFERENCES "public"."closeout_month"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "closeout_month" ADD CONSTRAINT "closeout_month_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "closeout_item_month_id_idx" ON "closeout_item" USING btree ("month_id");