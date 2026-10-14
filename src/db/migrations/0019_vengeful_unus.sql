CREATE TABLE "gift" (
	"id" text PRIMARY KEY NOT NULL,
	"recipient_id" text NOT NULL,
	"name" text NOT NULL,
	"occasion" text,
	"price_cents" integer,
	"link" text,
	"given_on" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gift_name_length" CHECK (char_length("gift"."name") between 1 and 200),
	CONSTRAINT "gift_occasion_length" CHECK (char_length("gift"."occasion") between 1 and 60),
	CONSTRAINT "gift_price_cents" CHECK ("gift"."price_cents" between 0 and 10000000),
	CONSTRAINT "gift_link_length" CHECK (char_length("gift"."link") between 1 and 2000)
);
--> statement-breakpoint
CREATE TABLE "gift_recipient" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gift_recipient_name_length" CHECK (char_length("gift_recipient"."name") between 1 and 100)
);
--> statement-breakpoint
ALTER TABLE "gift" ADD CONSTRAINT "gift_recipient_id_gift_recipient_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."gift_recipient"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_recipient" ADD CONSTRAINT "gift_recipient_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gift_recipient_id_idx" ON "gift" USING btree ("recipient_id");--> statement-breakpoint
CREATE UNIQUE INDEX "gift_recipient_user_name_idx" ON "gift_recipient" USING btree ("user_id",lower("name"));