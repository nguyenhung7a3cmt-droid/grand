
import { getDB } from './src/server/catalogServerPlugin.js';
import { DatabaseSync } from 'node:sqlite';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'grandstock.sqlite');
const db = new DatabaseSync(dbPath);

console.log('Cleaning mock/seed reviews and proofs from SQLite...');
// Delete seed reviews that are not real Discord vouches
const delRev = db.prepare("DELETE FROM reviews WHERE id NOT LIKE 'rev-disc-%'").run();
console.log(`Deleted ${delRev.changes} mock reviews from SQLite.`);

// Delete seed proofs that are not real Discord vouches
const delPrf = db.prepare("DELETE FROM proofs WHERE id NOT LIKE 'PROOF-GS-DISC-%'").run();
console.log(`Deleted ${delPrf.changes} mock proofs from SQLite.`);

const remainingRev = db.prepare("SELECT COUNT(*) as count FROM reviews").get().count;
const remainingPrf = db.prepare("SELECT COUNT(*) as count FROM proofs").get().count;
console.log(`Database now strictly contains ${remainingRev} REAL Discord reviews and ${remainingPrf} REAL Discord proofs!`);
