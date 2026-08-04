-- Hacer users.password_hash nullable: un usuario creado por el admin no tiene
-- contraseña hasta que activa su cuenta con un link de invitación. SQLite no
-- permite ALTER de un NOT NULL directo, así que se recrea la tabla preservando
-- los datos (foreign_keys=OFF durante la migración evita el cascade de sessions
-- y project_members al DROP).
CREATE TABLE `__new_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password_hash` text,
	`is_admin` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_users` (`id`, `username`, `password_hash`, `is_admin`, `created_at`)
	SELECT `id`, `username`, `password_hash`, `is_admin`, `created_at` FROM `users`;
--> statement-breakpoint
DROP TABLE `users`;
--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);
--> statement-breakpoint
-- Invite tokens: link de un solo uso para que el usuario ponga su propia
-- contraseña. Mismo patrón que sessions — solo se guarda el SHA-256 del token.
CREATE TABLE `invites` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
