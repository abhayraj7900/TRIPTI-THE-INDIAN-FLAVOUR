CREATE TABLE `table_bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_number` text NOT NULL,
	`customer_name` text NOT NULL,
	`phone` text NOT NULL,
	`guests` integer NOT NULL,
	`booking_date` text NOT NULL,
	`booking_time` text NOT NULL,
	`table_number` text NOT NULL,
	`notes` text,
	`status` text DEFAULT 'booked' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `table_bookings_booking_number_unique` ON `table_bookings` (`booking_number`);--> statement-breakpoint
CREATE INDEX `idx_bookings_status_date` ON `table_bookings` (`status`,`booking_date`);--> statement-breakpoint
CREATE INDEX `idx_bookings_table_slot` ON `table_bookings` (`table_number`,`booking_date`,`booking_time`);--> statement-breakpoint
ALTER TABLE `orders` ADD `notes` text;