CREATE TABLE `customer_profiles` (
	`phone` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `menu_items` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`note` text NOT NULL,
	`price` integer NOT NULL,
	`category` text NOT NULL,
	`veg` integer DEFAULT true NOT NULL,
	`photo` integer DEFAULT 0 NOT NULL,
	`photo_url` text,
	`badge` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_menu_items_active_category` ON `menu_items` (`active`,`category`);--> statement-breakpoint
CREATE TABLE `site_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `customer_phone` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `delivery_address` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `latitude` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `longitude` text;--> statement-breakpoint
CREATE INDEX `idx_orders_customer_phone` ON `orders` (`customer_phone`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_bookings_phone` ON `table_bookings` (`phone`,`created_at`);