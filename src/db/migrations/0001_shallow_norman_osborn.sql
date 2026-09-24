CREATE TABLE "vision_board" (
	"user_id" text PRIMARY KEY NOT NULL,
	"id" text NOT NULL,
	"data" text NOT NULL,
	"content_type" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vision_board_id_unique" UNIQUE("id")
);
--> statement-breakpoint
ALTER TABLE "vision_board" ADD CONSTRAINT "vision_board_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;