DELETE FROM `utm_options` WHERE `source_value` = '' AND `branch` = 'medium' AND `value` IN ('cpc', 'email', 'social', 'organic', 'referral');
--> statement-breakpoint
DELETE FROM `utm_options` WHERE `source_value` = '' AND `branch` = 'campaign' AND `value` IN ('launch', 'promo');
--> statement-breakpoint
DELETE FROM `utm_options` WHERE `source_value` = '' AND `branch` = 'term' AND `value` IN ('brand', 'product');
--> statement-breakpoint
DELETE FROM `utm_options` WHERE `source_value` = '' AND `branch` = 'categories' AND `value` IN ('text', 'image', 'video', 'banner');
--> statement-breakpoint
DELETE FROM `utm_options` WHERE `source_value` = '' AND `branch` = 'themes' AND `value` IN ('brand', 'product', 'promo', 'education');
--> statement-breakpoint
DELETE FROM `utm_sources` WHERE `value` IN ('youtube', 'blog');