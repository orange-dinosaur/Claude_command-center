ALTER TABLE "creative_cycle" ADD COLUMN "opening_nourishing" text;--> statement-breakpoint
ALTER TABLE "creative_cycle" ADD COLUMN "opening_draining" text;--> statement-breakpoint
ALTER TABLE "creative_cycle" ADD COLUMN "opening_success" text;--> statement-breakpoint
ALTER TABLE "creative_cycle" ADD COLUMN "setup" boolean[] DEFAULT '{false,false,false,false}' NOT NULL;--> statement-breakpoint
ALTER TABLE "creative_cycle" ADD COLUMN "midpoint_shifted" text;--> statement-breakpoint
ALTER TABLE "creative_cycle" ADD COLUMN "midpoint_helping" text;--> statement-breakpoint
ALTER TABLE "creative_cycle" ADD COLUMN "midpoint_simplify" text;--> statement-breakpoint
ALTER TABLE "creative_cycle" ADD COLUMN "closing_shift_1" text;--> statement-breakpoint
ALTER TABLE "creative_cycle" ADD COLUMN "closing_shift_2" text;--> statement-breakpoint
ALTER TABLE "creative_cycle" ADD COLUMN "closing_shift_3" text;--> statement-breakpoint
ALTER TABLE "creative_cycle" ADD COLUMN "closing_practice" text;--> statement-breakpoint
ALTER TABLE "creative_cycle" ADD COLUMN "closing_discovery" text;--> statement-breakpoint
ALTER TABLE "creative_cycle" ADD COLUMN "closing_made" text;--> statement-breakpoint
ALTER TABLE "creative_cycle" ADD COLUMN "closing_belief" text;--> statement-breakpoint
ALTER TABLE "creative_cycle" ADD COLUMN "closing_promise" text;--> statement-breakpoint
ALTER TABLE "creative_cycle" ADD CONSTRAINT "creative_cycle_setup" CHECK (cardinality("creative_cycle"."setup") = 4);