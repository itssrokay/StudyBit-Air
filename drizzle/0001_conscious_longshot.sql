CREATE TABLE `user_ai_keys` (
	`user_id` text PRIMARY KEY NOT NULL,
	`ciphertext` text NOT NULL,
	`iv` text NOT NULL,
	`model` text DEFAULT 'gpt-4.1-mini' NOT NULL,
	`updated_at` text NOT NULL
);
