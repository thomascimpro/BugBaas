CREATE TABLE `strava_activities` (
	`uid` text NOT NULL,
	`activity_id` text NOT NULL,
	`sport_type` text NOT NULL,
	`distance_meters` integer NOT NULL,
	`start_date_local` text NOT NULL,
	PRIMARY KEY(`uid`, `activity_id`)
);
--> statement-breakpoint
CREATE TABLE `strava_connections` (
	`uid` text PRIMARY KEY NOT NULL,
	`athlete_id` text NOT NULL,
	`athlete_name` text,
	`access_token` text NOT NULL,
	`refresh_token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`last_sync_at` text,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `strava_oauth_states` (
	`state` text PRIMARY KEY NOT NULL,
	`uid` text NOT NULL,
	`expires_at` integer NOT NULL
);
