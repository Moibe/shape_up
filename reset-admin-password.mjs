import Database from 'better-sqlite3';
import { randomBytes, scryptSync } from 'node:crypto';

const db = new Database('./local.db');
const hashPw = (pw) => {
	const salt = randomBytes(16);
	return `${salt.toString('hex')}:${scryptSync(pw, salt, 64).toString('hex')}`;
};

db.prepare('UPDATE users SET password_hash = ? WHERE username = ?').run(hashPw('admin'), 'admin');
console.log('Reset done -> username: admin | password: admin');
db.close();
