CREATE TABLE "bucket_invite" (
	"id" text PRIMARY KEY NOT NULL,
	"from_user_id" text NOT NULL,
	"to_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bucket_invite_from_user_id_unique" UNIQUE("from_user_id")
);
--> statement-breakpoint
CREATE TABLE "bucket_item" (
	"id" text PRIMARY KEY NOT NULL,
	"season_id" text NOT NULL,
	"text" text NOT NULL,
	"added_by" text,
	"done_on" date,
	"position" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bucket_list" (
	"id" text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bucket_list_member" (
	"user_id" text PRIMARY KEY NOT NULL,
	"list_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bucket_season" (
	"id" text PRIMARY KEY NOT NULL,
	"list_id" text NOT NULL,
	"year" integer NOT NULL,
	"season" text NOT NULL,
	CONSTRAINT "bucket_season_list_id_year_season_unique" UNIQUE("list_id","year","season"),
	CONSTRAINT "bucket_season_season" CHECK ("bucket_season"."season" in ('primavera', 'estate', 'autunno', 'inverno'))
);
--> statement-breakpoint
ALTER TABLE "bucket_invite" ADD CONSTRAINT "bucket_invite_from_user_id_user_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bucket_invite" ADD CONSTRAINT "bucket_invite_to_user_id_user_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bucket_item" ADD CONSTRAINT "bucket_item_season_id_bucket_season_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."bucket_season"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bucket_item" ADD CONSTRAINT "bucket_item_added_by_user_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bucket_list_member" ADD CONSTRAINT "bucket_list_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bucket_list_member" ADD CONSTRAINT "bucket_list_member_list_id_bucket_list_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."bucket_list"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bucket_season" ADD CONSTRAINT "bucket_season_list_id_bucket_list_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."bucket_list"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bucket_item_season_id_idx" ON "bucket_item" USING btree ("season_id");--> statement-breakpoint
CREATE INDEX "bucket_list_member_list_id_idx" ON "bucket_list_member" USING btree ("list_id");