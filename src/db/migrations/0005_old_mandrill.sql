CREATE TABLE "creative_cycle" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"start_date" date NOT NULL,
	"interrupted_on" date,
	"intent_practice" text,
	"intent_feeling" text,
	"intent_project" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "creative_cycle_user_id_start_date_unique" UNIQUE("user_id","start_date"),
	CONSTRAINT "creative_cycle_monday" CHECK (extract(isodow from "creative_cycle"."start_date") = 1),
	CONSTRAINT "creative_cycle_interrupted_within" CHECK ("creative_cycle"."interrupted_on" between "creative_cycle"."start_date" and "creative_cycle"."start_date" + 83)
);
--> statement-breakpoint
CREATE TABLE "creative_week" (
	"cycle_id" text NOT NULL,
	"week" integer NOT NULL,
	"daily_pages" boolean[] DEFAULT '{false,false,false,false,false,false,false}' NOT NULL,
	"outing" boolean DEFAULT false NOT NULL,
	"tiny_action" boolean DEFAULT false NOT NULL,
	"evidence" boolean[] DEFAULT '{}' NOT NULL,
	"energy" integer,
	"notes" text,
	"carry_forward" text,
	"reviewed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "creative_week_cycle_id_week_pk" PRIMARY KEY("cycle_id","week"),
	CONSTRAINT "creative_week_week" CHECK ("creative_week"."week" between 1 and 12),
	CONSTRAINT "creative_week_daily_pages" CHECK (cardinality("creative_week"."daily_pages") = 7),
	CONSTRAINT "creative_week_energy" CHECK ("creative_week"."energy" between 1 and 10)
);
--> statement-breakpoint
ALTER TABLE "creative_cycle" ADD CONSTRAINT "creative_cycle_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creative_week" ADD CONSTRAINT "creative_week_cycle_id_creative_cycle_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."creative_cycle"("id") ON DELETE cascade ON UPDATE no action;