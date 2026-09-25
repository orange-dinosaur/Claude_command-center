ALTER TABLE "checkup" DROP CONSTRAINT "checkup_user_id_name_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "checkup_user_id_name_idx" ON "checkup" USING btree ("user_id",lower("name"));