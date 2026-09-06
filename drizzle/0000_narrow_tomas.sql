CREATE TABLE `inventory` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`unit` text NOT NULL,
	`quantity` integer NOT NULL,
	`reorder_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` text NOT NULL,
	`menu_item_id` integer NOT NULL,
	`name` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit_price` integer NOT NULL,
	`line_total` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_order_items_order_id` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`order_number` text NOT NULL,
	`order_type` text NOT NULL,
	`table_number` text,
	`customer_name` text,
	`status` text DEFAULT 'new' NOT NULL,
	`payment_status` text DEFAULT 'pending' NOT NULL,
	`payment_method` text,
	`subtotal` integer NOT NULL,
	`tax` integer NOT NULL,
	`discount` integer DEFAULT 0 NOT NULL,
	`total` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_order_number_unique` ON `orders` (`order_number`);--> statement-breakpoint
CREATE INDEX `idx_orders_status_created_at` ON `orders` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_orders_payment_status` ON `orders` (`payment_status`);
--> statement-breakpoint
PRAGMA optimize;
