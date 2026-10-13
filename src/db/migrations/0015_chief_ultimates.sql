CREATE TABLE "glimmer" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"text" text NOT NULL,
	"happened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "glimmer_text_length" CHECK (char_length("glimmer"."text") between 1 and 1000)
);
--> statement-breakpoint
ALTER TABLE "glimmer" ADD CONSTRAINT "glimmer_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "glimmer_user_id_idx" ON "glimmer" USING btree ("user_id");