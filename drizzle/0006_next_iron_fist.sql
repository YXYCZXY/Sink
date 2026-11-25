CREATE TABLE `utm_options` (
	`source_value` text NOT NULL,
	`branch` text NOT NULL,
	`value` text NOT NULL,
	`label` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`source_value`, `branch`, `value`),
	FOREIGN KEY (`source_value`) REFERENCES `utm_sources`(`value`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `utm_options_source_value_branch_idx` ON `utm_options` (`source_value`,`branch`);--> statement-breakpoint
CREATE TABLE `utm_sources` (
	`value` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`fallback` integer DEFAULT false NOT NULL,
	`position` integer DEFAULT 0 NOT NULL
);
