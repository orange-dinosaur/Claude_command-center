CREATE TABLE "habit" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"mode" text NOT NULL,
	"sport" boolean DEFAULT false NOT NULL,
	"weekly_target" integer,
	"unit" text,
	"daily_target" integer,
	"position" integer NOT NULL,
	"archived_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "habit_mode_fields" CHECK (case "habit"."mode"
                when 'daily' then "habit"."weekly_target" is null and "habit"."unit" is null and "habit"."daily_target" is null
                when 'weekly' then "habit"."weekly_target" between 1 and 7 and "habit"."unit" is null and "habit"."daily_target" is null
                when 'amount' then "habit"."weekly_target" is null and "habit"."unit" is not null and "habit"."daily_target" >= 1
                else false end),
	CONSTRAINT "habit_sport_weekly" CHECK (not "habit"."sport" or ("habit"."mode" = 'weekly' and "habit"."archived_at" is null))
);
--> statement-breakpoint
CREATE TABLE "habit_day" (
	"habit_id" text NOT NULL,
	"date" date NOT NULL,
	"amount" integer,
	CONSTRAINT "habit_day_habit_id_date_pk" PRIMARY KEY("habit_id","date"),
	CONSTRAINT "habit_day_amount" CHECK ("habit_day"."amount" >= 1)
);
--> statement-breakpoint
ALTER TABLE "habit" ADD CONSTRAINT "habit_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit_day" ADD CONSTRAINT "habit_day_habit_id_habit_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habit"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "habit_user_id_idx" ON "habit" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "habit_user_id_sport_idx" ON "habit" USING btree ("user_id") WHERE "habit"."sport";