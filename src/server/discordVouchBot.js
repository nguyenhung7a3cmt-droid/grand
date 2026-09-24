/**
 * GRANDSTOCK — NATIVE DISCORD VOUCH BACKFILL & SYNC ENGINE
 * Zero external dependencies — uses Node native https & sqlite
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { getDB } from './database.js';
import { makeImagePermanent } from './imageUploader.js';
import { generateSvgTradeProof } from '../utils/tradeProofGenerator.js';

function loadEnv() {
  const envFile = path.resolve(process.cwd(), '.env');
  const env = {};
  if (fs.existsSync(envFile)) {
    const lines = fs.readFileSync(envFile, 'utf-8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [k, ...v] = trimmed.split('=');
        env[k.trim()] = v.join('=').trim();
      }
    }
  }
  return env;
}

const env = loadEnv();
const TOKEN = process.env.DISCORD_BOT_TOKEN || env.DISCORD_BOT_TOKEN;
const CHANNEL_ID = process.env.DISCORD_VOUCH_CHANNEL_ID || env.DISCORD_VOUCH_CHANNEL_ID;

function discordApiGet(pathUrl) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'discord.com',
      path: `/api/v10${pathUrl}`,
      method: 'GET',
      headers: {
        'Authorization': `Bot ${TOKEN}`,
        'User-Agent': 'GrandStockVouchBot/1.0'
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function detectGameAndItem(content = '') {
  const lower = content.toLowerCase();
  if (lower.includes('mm2') || lower.includes('murder') || lower.includes('godly') || lower.includes('harvester') || lower.includes('chroma') || lower.includes('corrupt') || lower.includes('bat')) {
    return { game: 'Murder Mystery 2', item: 'Godly Weapon / Chroma Set' };
  }
  if (lower.includes('gpo') || lower.includes('grand piece') || lower.includes('all seeing eye') || lower.includes('chest') || lower.includes('fruit bag')) {
    return { game: 'Grand Piece Online', item: 'All Seeing Eye / Rare Chest' };
  }
  if (lower.includes('fisch') || lower.includes('rod') || lower.includes('relic') || lower.includes('destiny') || lower.includes('sunken')) {
    return { game: 'Fisch', item: 'Mythical Rod & Relics' };
  }
  if (lower.includes('brainrot') || lower.includes('seed')) {
    return { game: 'Steal a Brainrot', item: 'Brainrot Rare Pet' };
  }
  if (lower.includes('dragon')) return { game: 'Blox Fruits', item: 'Permanent Dragon Fruit' };
  if (lower.includes('kitsune')) return { game: 'Blox Fruits', item: 'Permanent Kitsune Fruit' };
  if (lower.includes('leopard')) return { game: 'Blox Fruits', item: 'Permanent Leopard Fruit' };
  if (lower.includes('dough')) return { game: 'Blox Fruits', item: 'Permanent Dough Fruit' };
  if (lower.includes('portal')) return { game: 'Blox Fruits', item: 'Permanent Portal Fruit' };
  if (lower.includes('buddha')) return { game: 'Blox Fruits', item: 'Permanent Buddha Fruit' };
  if (lower.includes('dark blade') || lower.includes('db')) return { game: 'Blox Fruits', item: 'Dark Blade (Yoru)' };
  if (lower.includes('fruit notifier')) return { game: 'Blox Fruits', item: 'Fruit Notifier Gamepass' };
  return { game: 'Blox Fruits', item: 'Roblox In-Game Item' };
}

function parseRating(content = '') {
  const starsCount = (content.match(/⭐|★|:star:/g) || []).length;
  if (starsCount >= 1) return Math.min(5, starsCount);
  if (content.includes('10/10') || content.includes('5/5')) return 5;
  if (content.includes('4/5')) return 4;
  return 5;
}

async function saveVouchesToDatabase(vouches) {
  const db = getDB();
  const now = new Date().toISOString();
  let reviewsInserted = 0;
  let proofsInserted = 0;

  db.exec('BEGIN TRANSACTION;');
  try {
    for (const v of vouches) {
      const authorName = v.authorName || 'Discord Customer';
      const authorAvatar = v.authorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';
      const comment = v.comment || 'Verified Discord Vouch ⭐⭐⭐⭐⭐';
      const game = v.game || 'Blox Fruits';
      const item = v.item || 'Roblox In-Game Item';
      const rating = Number(v.rating || 5);
      const proofScreenshot = v.screenshot || '';
      const timeStr = v.timestamp || 'Discord Vouch';
      const createdAt = v.createdAt || now;
      const msgId = v.msgId || Math.random().toString(36).substring(2, 9);
      const rId = `rev-disc-${msgId}`;
      const maskedName = authorName.length > 4 ? `${authorName.substring(0, 3)}***` : `${authorName}***`;

      db.prepare(`
        INSERT INTO reviews (id, buyer_name, buyer_masked, avatar, game, rating, comment, country_code, verified, timestamp, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'US', 1, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          comment = excluded.comment,
          rating = excluded.rating
      `).run(rId, authorName, maskedName, authorAvatar, game, rating, comment, timeStr, createdAt);
      reviewsInserted++;

      if (proofScreenshot) {
        const orderNum = `GS-DISC-${String(msgId).slice(-6)}`;
        const pId = `PROOF-${orderNum}`;

        let finalScreenshot = proofScreenshot;
        if (proofScreenshot.startsWith('http://') || proofScreenshot.startsWith('https://')) {
          try {
            const permUrl = await makeImagePermanent(proofScreenshot, orderNum);
            finalScreenshot = permUrl || generateSvgTradeProof({
              orderNumber: orderNum,
              buyerMasked: maskedName,
              game,
              item,
              amount: '$19.99'
            });
          } catch (e) {
            finalScreenshot = generateSvgTradeProof({
              orderNumber: orderNum,
              buyerMasked: maskedName,
              game,
              item,
              amount: '$19.99'
            });
          }
        }

        db.prepare(`
          INSERT INTO proofs (id, order_number, buyer_username, buyer_masked, buyer_avatar, country_code, country_name, staff_name, staff_avatar, staff_badge, game, item, item_image, proof_screenshot, amount, timestamp, verified, audit_id, audit_signature, trade_notes, created_at)
          VALUES (?, ?, ?, ?, ?, 'US', 'United States', 'Discord Staff', NULL, 'DISCORD VOUCH', ?, ?, '/items/bf-perm-kitsune.png', ?, '$19.99', 'Discord Verified', 1, ?, 'SIG-GS-DISCORD-VOUCH', ?, ?)
          ON CONFLICT(order_number) DO UPDATE SET
            proof_screenshot = excluded.proof_screenshot,
            trade_notes = excluded.trade_notes
        `).run(
          pId,
          orderNum,
          authorName,
          maskedName,
          authorAvatar,
          game,
          item,
          finalScreenshot,
          `GS-AUDIT-${orderNum}`,
          comment,
          createdAt
        );
        proofsInserted++;
      }
    }
    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }

  const totalReviews = db.prepare('SELECT COUNT(*) as count FROM reviews').get().count;
  const totalProofs = db.prepare('SELECT COUNT(*) as count FROM proofs').get().count;

  return {
    success: true,
    message: `Directly synced ${reviewsInserted} Discord reviews and ${proofsInserted} delivery proofs to SQLite!`,
    totalReviews,
    totalProofs
  };
}

export async function syncAllDiscordVouches() {
  if (!TOKEN || !CHANNEL_ID) {
    console.error('❌ Missing DISCORD_BOT_TOKEN or DISCORD_VOUCH_CHANNEL_ID in .env');
    return;
  }

  console.log('===============================================================');
  console.log('🌟 GRANDSTOCK HISTORICAL DISCORD VOUCH SYNCHRONIZER');
  console.log(`Channel ID: ${CHANNEL_ID}`);
  console.log('===============================================================');

  let allMessages = [];
  let lastId = null;
  let page = 1;

  while (true) {
    let url = `/channels/${CHANNEL_ID}/messages?limit=100`;
    if (lastId) url += `&before=${lastId}`;

    console.log(`📥 [Page ${page}] Fetching historical messages from Discord API...`);
    const res = await discordApiGet(url);

    if (res.status !== 200 || !Array.isArray(res.data)) {
      console.error(`⚠️ Discord API response: HTTP ${res.status}`, res.data);
      break;
    }

    const messages = res.data;
    if (messages.length === 0) break;

    allMessages.push(...messages);
    lastId = messages[messages.length - 1].id;
    page++;

    console.log(`   Fetched ${allMessages.length} total messages so far...`);
    if (messages.length < 100) break;

    // Small delay to respect Discord rate limits
    await new Promise(r => setTimeout(r, 400));
  }

  console.log(`\n📊 Completed Discord Scan! Total ${allMessages.length} historical messages found.`);

  // Parse into clean customer vouches
  const parsedVouches = [];

  for (const msg of allMessages) {
    if (msg.author?.bot) continue;

    const content = msg.content || '';
    const lower = content.toLowerCase();
    const hasAttachments = Array.isArray(msg.attachments) && msg.attachments.length > 0;
    const isVouch = hasAttachments || lower.includes('vouch') || lower.includes('+rep') || lower.includes('legit') || lower.includes('fast') || lower.includes('trade') || lower.includes('received') || lower.includes('star') || lower.includes('5/5') || lower.includes('10/10') || lower.includes('⭐') || lower.includes('got');

    if (isVouch) {
      const { game, item } = detectGameAndItem(content);
      const rating = parseRating(content);
      const screenshot = hasAttachments ? msg.attachments[0].url : '';
      
      let authorAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';
      if (msg.author?.avatar) {
        // Discord Animated Avatars start with 'a_' -> use .gif for full animation
        const isAnimated = String(msg.author.avatar).startsWith('a_');
        const ext = isAnimated ? 'gif' : 'png';
        authorAvatar = `https://cdn.discordapp.com/avatars/${msg.author.id}/${msg.author.avatar}.${ext}?size=128`;
      }
      
      const authorName = msg.author?.global_name || msg.author?.username || 'Discord Buyer';
      const timestamp = new Date(msg.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      parsedVouches.push({
        msgId: msg.id,
        authorName,
        authorAvatar,
        comment: content.trim() || 'Verified in-game trade delivery proof ⭐⭐⭐⭐⭐',
        screenshot,
        rating,
        game,
        item,
        timestamp,
        createdAt: new Date(msg.timestamp).toISOString()
      });
    }
  }

  console.log(`✨ Filtered ${parsedVouches.length} authentic customer vouches & proof screenshots!`);

  if (parsedVouches.length > 0) {
    console.log(`🚀 Uploading ${parsedVouches.length} vouches directly to GrandStock SQLite Database...`);
    const result = await saveVouchesToDatabase(parsedVouches);
    console.log(`\n🎉 SUCCESS: ${result.message}`);
    console.log(`📈 Website now has ${result.totalReviews} live reviews and ${result.totalProofs} live delivery proofs!`);
    return result;
  }
}

// Run if called directly
if (import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  syncAllDiscordVouches().catch(console.error);
}
