CREATE TABLE `audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`at` text NOT NULL,
	`user_id` text DEFAULT 'local' NOT NULL,
	`entity` text NOT NULL,
	`entity_id` text NOT NULL,
	`action` text NOT NULL,
	`changes` text DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_entity_idx` ON `audit_log` (`entity`,`entity_id`);--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`name` text NOT NULL,
	`role` text,
	`email` text,
	`phone` text,
	`is_primary` integer DEFAULT false NOT NULL,
	`note` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`created_by` text DEFAULT 'local' NOT NULL,
	`updated_by` text DEFAULT 'local' NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `contacts_customer_idx` ON `contacts` (`customer_id`);--> statement-breakpoint
CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`ico` text,
	`dic` text,
	`ic_dph` text,
	`street` text,
	`city` text,
	`zip` text,
	`country` text DEFAULT 'SK' NOT NULL,
	`email` text,
	`phone` text,
	`web` text,
	`note` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`created_by` text DEFAULT 'local' NOT NULL,
	`updated_by` text DEFAULT 'local' NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE INDEX `customers_ico_idx` ON `customers` (`ico`);--> statement-breakpoint
CREATE INDEX `customers_name_idx` ON `customers` (`name`);--> statement-breakpoint
CREATE TABLE `import_batches` (
	`id` text PRIMARY KEY NOT NULL,
	`file_name` text NOT NULL,
	`imported_at` text NOT NULL,
	`rows_total` integer DEFAULT 0 NOT NULL,
	`created_count` integer DEFAULT 0 NOT NULL,
	`updated_count` integer DEFAULT 0 NOT NULL,
	`unchanged_count` integer DEFAULT 0 NOT NULL,
	`error_count` integer DEFAULT 0 NOT NULL,
	`errors` text DEFAULT '[]' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`created_by` text DEFAULT 'local' NOT NULL,
	`updated_by` text DEFAULT 'local' NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`number` text NOT NULL,
	`variable_symbol` text,
	`customer_id` text,
	`order_id` text,
	`customer_name_raw` text,
	`customer_ico_raw` text,
	`issue_date` text NOT NULL,
	`taxable_date` text,
	`due_date` text NOT NULL,
	`currency` text DEFAULT 'EUR' NOT NULL,
	`total_net` integer DEFAULT 0 NOT NULL,
	`total_vat` integer DEFAULT 0 NOT NULL,
	`total_gross` integer DEFAULT 0 NOT NULL,
	`imported_paid` integer DEFAULT 0 NOT NULL,
	`cancelled` integer DEFAULT false NOT NULL,
	`source` text DEFAULT 'manual' NOT NULL,
	`import_batch_id` text,
	`note` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`created_by` text DEFAULT 'local' NOT NULL,
	`updated_by` text DEFAULT 'local' NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`import_batch_id`) REFERENCES `import_batches`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_number_uq` ON `invoices` (`number`);--> statement-breakpoint
CREATE INDEX `invoices_customer_idx` ON `invoices` (`customer_id`);--> statement-breakpoint
CREATE INDEX `invoices_due_idx` ON `invoices` (`due_date`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`number` text NOT NULL,
	`customer_id` text NOT NULL,
	`quote_id` text,
	`title` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`order_date` text NOT NULL,
	`deadline` text,
	`currency` text DEFAULT 'EUR' NOT NULL,
	`total_net` integer DEFAULT 0 NOT NULL,
	`total_gross` integer DEFAULT 0 NOT NULL,
	`note` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`created_by` text DEFAULT 'local' NOT NULL,
	`updated_by` text DEFAULT 'local' NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`quote_id`) REFERENCES `quotes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_number_uq` ON `orders` (`number`);--> statement-breakpoint
CREATE INDEX `orders_customer_idx` ON `orders` (`customer_id`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text NOT NULL,
	`paid_on` text NOT NULL,
	`amount` integer NOT NULL,
	`method` text DEFAULT 'bank' NOT NULL,
	`note` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`created_by` text DEFAULT 'local' NOT NULL,
	`updated_by` text DEFAULT 'local' NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `payments_invoice_idx` ON `payments` (`invoice_id`);--> statement-breakpoint
CREATE TABLE `pipeline_stages` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`position` integer NOT NULL,
	`kind` text DEFAULT 'open' NOT NULL,
	`color` text DEFAULT 'blue' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`created_by` text DEFAULT 'local' NOT NULL,
	`updated_by` text DEFAULT 'local' NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE TABLE `quote_items` (
	`id` text PRIMARY KEY NOT NULL,
	`quote_id` text NOT NULL,
	`position` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`quantity` real DEFAULT 1 NOT NULL,
	`unit` text DEFAULT 'ks' NOT NULL,
	`unit_price` integer DEFAULT 0 NOT NULL,
	`discount_pct` real DEFAULT 0 NOT NULL,
	`vat_rate` real DEFAULT 23 NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`created_by` text DEFAULT 'local' NOT NULL,
	`updated_by` text DEFAULT 'local' NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`quote_id`) REFERENCES `quotes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `quote_items_quote_idx` ON `quote_items` (`quote_id`);--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` text PRIMARY KEY NOT NULL,
	`number` text NOT NULL,
	`customer_id` text NOT NULL,
	`contact_id` text,
	`title` text NOT NULL,
	`stage_id` text NOT NULL,
	`issue_date` text NOT NULL,
	`valid_until` text,
	`expected_close_date` text,
	`currency` text DEFAULT 'EUR' NOT NULL,
	`intro_text` text,
	`note` text,
	`lost_reason` text,
	`total_net` integer DEFAULT 0 NOT NULL,
	`total_vat` integer DEFAULT 0 NOT NULL,
	`total_gross` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`created_by` text DEFAULT 'local' NOT NULL,
	`updated_by` text DEFAULT 'local' NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`stage_id`) REFERENCES `pipeline_stages`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `quotes_number_uq` ON `quotes` (`number`);--> statement-breakpoint
CREATE INDEX `quotes_customer_idx` ON `quotes` (`customer_id`);--> statement-breakpoint
CREATE INDEX `quotes_stage_idx` ON `quotes` (`stage_id`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_by` text DEFAULT 'local' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`created_by` text DEFAULT 'local' NOT NULL,
	`updated_by` text DEFAULT 'local' NOT NULL,
	`deleted_at` text
);
