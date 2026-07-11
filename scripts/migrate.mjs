import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

const url = process.env.DATABASE_URL ?? './local.db';
const sqlite = new Database(url);

// Disable FK enforcement during migrations. Drizzle's SQLite "table recreate"
// migrations DROP the old table; with FKs on, that DROP cascades into child rows
// (scopes/nogos). Setting this on the connection (outside any transaction) holds
// through the migrator, so recreates don't wipe children.
sqlite.pragma('foreign_keys = OFF');

const db = drizzle(sqlite);

migrate(db, { migrationsFolder: './drizzle' });

sqlite.close();
console.log(`Migrations applied to ${url}`);
