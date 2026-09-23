import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

import { products as defaultProducts } from '../data/products.js';
import { games as defaultGames } from '../data/games.js';
import { proofs as defaultProofs } from '../data/proofs.js';
import { reviews as defaultReviews } from '../data/reviews.js';

const DB_FILE = path.resolve(process.cwd(), 'src/server/grandstock.db');

// Cryptographic Security Helpers (PBKDF2 with SHA-512 and 100,000 iterations)
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEYLEN = 64;
const PBKDF2_DIGEST = 'sha512';

export function hashPassword(password, salt = crypto.randomBytes(32).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST).toString('hex');
  return { salt, hash };
}

export function verifyPassword(password, salt, expectedHash) {
  if (!salt || !expectedHash) return false;
  const hash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expectedHash, 'hex'));
}

export function sanitizeUser(u) {
  if (!u) return null;
  const { password_hash, salt, passwordHash, ...safe } = u;
  return {
    id: safe.id,
    name: safe.name,
    email: safe.email,
    role: safe.role,
    isOwner: Boolean(safe.is_owner ?? safe.isOwner),
    robloxUsername: safe.roblox_username ?? safe.robloxUsername,
    avatar: safe.avatar,
    tradesCompleted: Number(safe.trades_completed ?? safe.tradesCompleted ?? 0),
    rating: safe.rating || '5.0★',
    assignedGames: typeof safe.assigned_games === 'string' ? JSON.parse(safe.assigned_games || '[]') : (safe.assignedGames || ['All Games']),
    countryCode: safe.country_code || safe.countryCode || 'US',
    countryName: safe.country_name || safe.countryName || 'United States',
    ipAddress: safe.ip_address ? (safe.ip_address.includes('.') ? `${safe.ip_address.split('.')[0]}.${safe.ip_address.split('.')[1]}.***.***` : '127.0.0.1') : '127.0.0.1',
    createdAt: safe.created_at || safe.createdAt
  };
}

let dbInstance = null;

export function getDB() {
  if (dbInstance) return dbInstance;

  const db = new DatabaseSync(DB_FILE);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA journal_mode = WAL;');

  // 1. Users Table (with IP Address & Country)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer',
      is_owner INTEGER NOT NULL DEFAULT 0,
      roblox_username TEXT NOT NULL,
      avatar TEXT NOT NULL,
      trades_completed INTEGER NOT NULL DEFAULT 0,
      rating TEXT NOT NULL DEFAULT '5.0★',
      assigned_games TEXT DEFAULT '["All Games"]',
      ip_address TEXT DEFAULT '127.0.0.1',
      country_code TEXT DEFAULT 'US',
      country_name TEXT DEFAULT 'United States',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // 2. Products Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      slug TEXT,
      name TEXT NOT NULL,
      game_id TEXT NOT NULL,
      game_name TEXT NOT NULL,
      category TEXT NOT NULL,
      rarity TEXT NOT NULL,
      original_price REAL NOT NULL,
      price REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 10,
      instant_delivery INTEGER NOT NULL DEFAULT 1,
      image TEXT NOT NULL,
      description TEXT,
      perks TEXT,
      trade_requirements TEXT,
      popular INTEGER NOT NULL DEFAULT 0,
      badge TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // 3. Games Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      count_text TEXT NOT NULL,
      popular INTEGER NOT NULL DEFAULT 0,
      description TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // 4. Tickets Table (with Buyer IP & Country)
  db.exec(`
    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      order_id TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'UNCLAIMED',
      status_step INTEGER NOT NULL DEFAULT 1,
      game TEXT NOT NULL,
      items_json TEXT NOT NULL,
      total REAL NOT NULL,
      pin_code TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      buyer_json TEXT NOT NULL,
      staff_json TEXT,
      ip_address TEXT DEFAULT '127.0.0.1',
      country_code TEXT DEFAULT 'US',
      country_name TEXT DEFAULT 'United States',
      audit_id TEXT,
      audit_signature TEXT,
      proof_screenshot TEXT,
      trade_notes TEXT,
      created_at TEXT NOT NULL,
      completed_at TEXT
    );
  `);

  // 5. Ticket Messages Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS ticket_messages (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      sender TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      avatar TEXT,
      badge TEXT,
      text TEXT,
      attachments_json TEXT,
      attachment TEXT,
      has_actions INTEGER DEFAULT 0,
      timestamp TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
    );
  `);

  // 6. Proofs Table (with Country)
  db.exec(`
    CREATE TABLE IF NOT EXISTS proofs (
      id TEXT PRIMARY KEY,
      order_number TEXT UNIQUE NOT NULL,
      buyer_username TEXT NOT NULL,
      buyer_masked TEXT NOT NULL,
      buyer_avatar TEXT,
      country_code TEXT DEFAULT 'US',
      country_name TEXT DEFAULT 'United States',
      staff_name TEXT NOT NULL,
      staff_avatar TEXT,
      staff_badge TEXT,
      game TEXT NOT NULL,
      item TEXT NOT NULL,
      item_image TEXT,
      proof_screenshot TEXT NOT NULL,
      amount TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      verified INTEGER NOT NULL DEFAULT 1,
      audit_id TEXT,
      audit_signature TEXT,
      trade_notes TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // 7. Reviews Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      buyer_name TEXT NOT NULL,
      buyer_masked TEXT NOT NULL,
      avatar TEXT,
      game TEXT NOT NULL,
      rating INTEGER NOT NULL DEFAULT 5,
      comment TEXT NOT NULL,
      country_code TEXT DEFAULT 'US',
      verified INTEGER NOT NULL DEFAULT 1,
      timestamp TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  // 8. Password Resets Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS password_resets (
      email TEXT PRIMARY KEY COLLATE NOCASE,
      otp_code TEXT NOT NULL,
      reset_token TEXT,
      expires_at INTEGER NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      verified INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);

  // 9. Dynamic Promo Codes / Coupons Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL COLLATE NOCASE,
      discount_pct REAL NOT NULL,
      min_spend REAL DEFAULT 0,
      max_uses INTEGER DEFAULT 0,
      used_count INTEGER DEFAULT 0,
      expires_at TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );
  `);

  // 10. Anti-Scam Fraud Blacklist Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS blacklist (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      value TEXT NOT NULL COLLATE NOCASE,
      reason TEXT,
      banned_by TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  // 11. Registration Email Verification OTP Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS registration_otps (
      email TEXT PRIMARY KEY COLLATE NOCASE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      roblox_username TEXT NOT NULL,
      otp_code TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);

  // Performance & Security Indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_reg_otps_email ON registration_otps(email);
    CREATE INDEX IF NOT EXISTS idx_tickets_order_id ON tickets(order_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
    CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
    CREATE INDEX IF NOT EXISTS idx_ticket_messages_lookup ON ticket_messages(ticket_id, created_at ASC);
    CREATE INDEX IF NOT EXISTS idx_products_game_id ON products(game_id);
    CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_games_popular ON games(popular DESC);
    CREATE INDEX IF NOT EXISTS idx_proofs_created_at ON proofs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
    CREATE INDEX IF NOT EXISTS idx_blacklist_val ON blacklist(value);
  `);

  // Auto-clean expired coupons that have an expiration date in the past
  try {
    const nowIso = new Date().toISOString();
    db.prepare('DELETE FROM coupons WHERE expires_at IS NOT NULL AND expires_at < ?').run(nowIso);
  } catch (e) {}

  seedInitialData(db);
  dbInstance = db;
  return db;
}

function seedInitialData(db) {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (id, name, email, password_hash, salt, role, is_owner, roblox_username, avatar, trades_completed, rating, assigned_games, ip_address, country_code, country_name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '127.0.0.1', 'VN', 'Vietnam', ?, ?)
    `);

    const defaultStaff = [
      {
        id: 'usr-owner-01',
        name: 'Site Owner',
        email: 'owner@grandstock.net',
        role: 'admin',
        isOwner: 1,
        robloxUsername: 'GS_SiteOwner',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        tradesCompleted: 6200,
        rating: '5.0★',
        assignedGames: '["All Games"]'
      },
      {
        id: 'usr-admin-01',
        name: 'GrandStock Admin',
        email: 'admin@grandstock.net',
        role: 'admin',
        isOwner: 1,
        robloxUsername: 'GS_MasterAdmin',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        tradesCompleted: 5820,
        rating: '5.0★',
        assignedGames: '["All Games"]'
      },
      {
        id: 'usr-staff-01',
        name: 'Agent Alex',
        email: 'alex@grandstock.net',
        role: 'staff',
        isOwner: 0,
        robloxUsername: 'GS_AlexStaff',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        tradesCompleted: 3420,
        rating: '4.99★',
        assignedGames: '["Blox Fruits", "MM2", "GPO"]'
      },
      {
        id: 'usr-staff-02',
        name: 'Mod Kitsune',
        email: 'kitsune@grandstock.net',
        role: 'staff',
        isOwner: 0,
        robloxUsername: 'GS_KitsuneMod',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
        tradesCompleted: 2150,
        rating: '4.98★',
        assignedGames: '["Blox Fruits", "Fisch", "Anime Defenders"]'
      }
    ];

    console.warn('⚠️ [SECURITY WARNING] Seed accounts initialized with one-time random passwords:');
    for (const u of defaultStaff) {
      const generatedPassword = crypto.randomBytes(16).toString('hex');
      console.warn(`⚠️ [SECURITY WARNING] Seed account ${u.email} initial random password: ${generatedPassword}`);
      const { salt, hash } = hashPassword(generatedPassword);
      const now = new Date().toISOString();
      insertUser.run(
        u.id,
        u.name,
        u.email.toLowerCase(),
        hash,
        salt,
        u.role,
        u.isOwner,
        u.robloxUsername,
        u.avatar,
        u.tradesCompleted,
        u.rating,
        u.assignedGames,
        now,
        now
      );
    }
  }

  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
  if (productCount === 0) {
    const insertProduct = db.prepare(`
      INSERT INTO products (id, slug, name, game_id, game_name, category, rarity, original_price, price, stock, instant_delivery, image, description, perks, trade_requirements, popular, badge, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of defaultProducts) {
      insertProduct.run(
        p.id,
        p.slug || p.id,
        p.name,
        p.gameId,
        p.gameName,
        p.category,
        p.rarity,
        p.originalPrice || p.price,
        p.price,
        p.stock || 10,
        p.instantDelivery ? 1 : 0,
        p.image,
        p.description || '',
        JSON.stringify(p.perks || []),
        p.tradeRequirements || '',
        p.popular ? 1 : 0,
        p.badge || '',
        new Date().toISOString()
      );
    }
  }

  const gameCount = db.prepare('SELECT COUNT(*) as count FROM games').get().count;
  if (gameCount === 0) {
    const insertGame = db.prepare(`
      INSERT INTO games (id, name, icon, count_text, popular, description, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const g of defaultGames) {
      insertGame.run(
        g.id,
        g.name,
        g.icon,
        g.count || `${g.itemCount || 10} items`,
        g.popular ? 1 : 0,
        g.desc || g.description || '',
        new Date().toISOString()
      );
    }
  }

  const proofCount = db.prepare('SELECT COUNT(*) as count FROM proofs').get().count;
  if (proofCount === 0) {
    const insertProof = db.prepare(`
      INSERT INTO proofs (id, order_number, buyer_username, buyer_masked, buyer_avatar, country_code, country_name, staff_name, staff_avatar, staff_badge, game, item, item_image, proof_screenshot, amount, timestamp, verified, audit_id, audit_signature, trade_notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const pr of defaultProofs) {
      insertProof.run(
        pr.id,
        pr.orderNumber,
        pr.buyerUsername || 'Player',
        pr.buyerMasked || 'Play***',
        pr.buyerAvatar || '',
        pr.countryCode || 'US',
        pr.countryName || 'United States',
        pr.staffName || 'Agent Alex',
        pr.staffAvatar || '',
        pr.staffBadge || 'VERIFIED STAFF',
        pr.game || 'Blox Fruits',
        pr.item,
        pr.itemImage || '',
        pr.proofScreenshot,
        pr.amount,
        pr.timestamp,
        pr.verified ? 1 : 0,
        pr.auditId || `GS-AUDIT-${pr.orderNumber}`,
        pr.auditSignature || 'SIG-GS-2026-VERIFIED',
        pr.tradeNotes || 'Trade verified.',
        pr.createdAt || new Date().toISOString()
      );
    }
  }

  // Seed starter promo code in SQLite if empty
  const couponCount = db.prepare('SELECT COUNT(*) as count FROM coupons').get().count;
  if (couponCount === 0) {
    const insertCoupon = db.prepare(`
      INSERT INTO coupons (id, code, discount_pct, min_spend, max_uses, used_count, expires_at, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, 0, ?, 1, ?)
    `);
    const now = new Date().toISOString();
    // Default: GRANDSTOCK2026 (10% off, no expiration), FLASH15 (15% off, expires in 7 days)
    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    insertCoupon.run('coup-01', 'GRANDSTOCK2026', 10, 0, 0, null, now);
    insertCoupon.run('coup-02', 'FLASH15', 15, 10, 100, weekFromNow, now);
  }
}
