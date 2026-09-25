CREATE TABLE "workout" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type_id" text NOT NULL,
	"date" date NOT NULL,
	"minutes" integer,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workout_minutes" CHECK ("workout"."minutes" between 1 and 600)
);
--> statement-breakpoint
CREATE TABLE "workout_type" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workout" ADD CONSTRAINT "workout_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout" ADD CONSTRAINT "workout_type_id_workout_type_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."workout_type"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_type" ADD CONSTRAINT "workout_type_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "workout_user_id_date_idx" ON "workout" USING btree ("user_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "workout_type_user_id_name_idx" ON "workout_type" USING btree ("user_id",lower("name"));