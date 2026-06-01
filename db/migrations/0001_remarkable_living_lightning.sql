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
	`channel` text NOT NULL,
	`sent_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`match_id`) REFERENCES `match`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reminder_sent_user_match_lead_channel_unique` ON `reminder_sent` (`user_id`,`match_id`,`lead_minutes`,`channel`);--> statement-breakpoint
CREATE TABLE `reminder_channel` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`channel` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reminder_channel_user_channel_unique` ON `reminder_channel` (`user_id`,`channel`);--> statement-breakpoint
CREATE TABLE `push_subscription` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `push_subscription_endpoint_unique` ON `push_subscription` (`endpoint`);