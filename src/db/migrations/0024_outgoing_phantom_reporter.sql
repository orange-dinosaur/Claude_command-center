CREATE TABLE "cover_image" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"data" text NOT NULL,
	"content_type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "saga" ADD COLUMN "cover_url" text;--> statement-breakpoint
ALTER TABLE "title" ADD COLUMN "cover_url" text;--> statement-breakpoint
ALTER TABLE "cover_image" ADD CONSTRAINT "cover_image_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cover_image_user_id_idx" ON "cover_image" USING btree ("user_id");