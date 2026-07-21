import Database from 'better-sqlite3';
import { randomBytes, scryptSync } from 'node:crypto';

// Seed SOLO el usuario admin inicial — sin datos demo. Para servidores reales
// (interno/DO) donde no quieres el proyecto/pitches de ejemplo de seed.mjs.
// Idempotente: no-op si ya hay algún usuario.
const url = process.env.DATABASE_URL ?? './local.db';
const db = new Database(url);

// Mismo formato scrypt "salt:hash" que src/lib/server/auth.ts. CHANGE THIS PASSWORD.
const hashPw = (pw) => {
	const salt = randomBytes(16);
	return `${salt.toString('hex')}:${scryptSync(pw, salt, 64).toString('hex')}`;
};

if (db.prepare('SELECT COUNT(*) AS n FROM users').get().n === 0) {
	db.prepare('INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, 1)').run('admin', hashPw('admin'));
	console.log('Seeded initial user → username: admin · password: admin  (¡cámbiala!)');
} else {
	console.log('Seed de admin omitido: ya hay usuarios.');
}

db.close();
