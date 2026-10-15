CREATE TABLE "semaforo_item" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"colour" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "semaforo_item_colour" CHECK ("semaforo_item"."colour" in ('red', 'orange', 'yellow', 'green')),
	CONSTRAINT "semaforo_item_name_length" CHECK (char_length("semaforo_item"."name") between 1 and 100)
);
--> statement-breakpoint
ALTER TABLE "semaforo_item" ADD CONSTRAINT "semaforo_item_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "semaforo_item_user_id_idx" ON "semaforo_item" USING btree ("user_id");