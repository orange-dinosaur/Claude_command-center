CREATE TABLE "brain_entry" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "brain_entry_text_length" CHECK (char_length("brain_entry"."text") between 1 and 1000)
);
--> statement-breakpoint
ALTER TABLE "brain_entry" ADD CONSTRAINT "brain_entry_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "brain_entry_user_id_idx" ON "brain_entry" USING btree ("user_id");