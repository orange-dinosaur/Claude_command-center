CREATE TABLE "lesson_activity" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type_id" text NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_pack" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"activity_id" text NOT NULL,
	"lessons" integer NOT NULL,
	"paid_on" date NOT NULL,
	"amount_cents" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_pack_lessons" CHECK ("lesson_pack"."lessons" between 1 and 100),
	CONSTRAINT "lesson_pack_amount" CHECK ("lesson_pack"."amount_cents" between 0 and 10000000)
);
--> statement-breakpoint
ALTER TABLE "workout" ADD COLUMN "lesson" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "lesson_activity" ADD CONSTRAINT "lesson_activity_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_activity" ADD CONSTRAINT "lesson_activity_type_id_workout_type_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."workout_type"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_pack" ADD CONSTRAINT "lesson_pack_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_pack" ADD CONSTRAINT "lesson_pack_activity_id_lesson_activity_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."lesson_activity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "lesson_activity_type_id_idx" ON "lesson_activity" USING btree ("type_id");--> statement-breakpoint
CREATE INDEX "lesson_activity_user_id_idx" ON "lesson_activity" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "lesson_pack_activity_id_idx" ON "lesson_pack" USING btree ("activity_id");