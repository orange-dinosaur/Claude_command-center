CREATE TABLE "saga" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"author" text,
	"volumes" integer NOT NULL,
	"volumes_read" integer DEFAULT 0 NOT NULL,
	"next_release" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saga_name_length" CHECK (char_length("saga"."name") between 1 and 100),
	CONSTRAINT "saga_volumes" CHECK ("saga"."volumes" between 1 and 99),
	CONSTRAINT "saga_volumes_read" CHECK ("saga"."volumes_read" between 0 and "saga"."volumes")
);
--> statement-breakpoint
ALTER TABLE "saga" ADD CONSTRAINT "saga_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "saga_user_id_idx" ON "saga" USING btree ("user_id");