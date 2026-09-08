CREATE TABLE `customer_otps` (
	`phone` text PRIMARY KEY NOT NULL,
	`code_hash` text NOT NULL,
	`code_salt` text NOT NULL,
	`purpose` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `order_feedback` (
	`order_id` text PRIMARY KEY NOT NULL,
	`customer_phone` text NOT NULL,
	`table_number` text,
	`food_rating` integer NOT NULL,
	`service_rating` integer NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_order_feedback_customer_phone` ON `order_feedback` (`customer_phone`,`created_at`);