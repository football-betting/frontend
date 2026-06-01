CREATE UNIQUE INDEX `tip_user_match_unique` ON `tip` (`user_id`,`match_id`);--> statement-breakpoint
CREATE TABLE `reminder_setting` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`lead_minutes` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reminder_setting_user_lead_unique` ON `reminder_setting` (`user_id`,`lead_minutes`);--> statement-breakpoint
CREATE TABLE `reminder_sent` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`match_id` integer NOT NULL,
	`lead_minutes` integer NOT NULL,
	`sent_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`match_id`) REFERENCES `match`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reminder_sent_user_match_lead_unique` ON `reminder_sent` (`user_id`,`match_id`,`lead_minutes`);