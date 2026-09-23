function sanitizeDiscordAvatar(url) {
  if (!url || typeof url !== 'string') return url;
  if (url.includes('cdn.discordapp.com/avatars/') && url.includes('/a_')) {
    return url.replace(/\.png(\?.*)?$/, '.gif$1').replace(/\.webp(\?.*)?$/, '.gif$1');
  }
  return url;
}
import { sendDiscordOrderNotification } from './discordNotifier.js';
import { syncAllDiscordVouches } from './discordVouchBot.js';
import https from 'https';
import crypto from 'crypto';
import { getDB } from './database.js';
import { getClientIP, resolveCountry, maskIP } from './geoHelper.js';

const FLAG_MAP = {
  'VN': '🇻🇳', 'US': '🇺🇸', 'PH': '🇵🇭', 'TH': '🇹🇭', 'ID': '🇮🇩',
  'MY': '🇲🇾', 'SG': '🇸🇬', 'GB': '🇬🇧', 'CA': '🇨🇦', 'AU': '🇦🇺',
  'DE': '🇩🇪', 'FR': '🇫🇷', 'JP': '🇯🇵', 'KR': '🇰🇷', 'BR': '🇧🇷',
  'MX': '🇲🇽', 'ES': '🇪🇸', 'IT': '🇮🇹', 'NL': '🇳🇱', 'SE': '🇸🇪'
};

function formatProductRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug || row.id,
    name: row.name,
    gameId: row.game_id,
    gameName: row.game_name,
    category: row.category,
    rarity: row.rarity,
    originalPrice: Number(row.original_price),
    price: Number(row.price),
    stock: Number(row.stock),
    instantDelivery: Boolean(row.instant_delivery),
    image: row.image,
    description: row.description,
    perks: typeof row.perks === 'string' ? JSON.parse(row.perks || '[]') : (row.perks || []),
    tradeRequirements: row.trade_requirements,
    popular: Boolean(row.popular),
    badge: row.badge,
    createdAt: row.created_at
  };
}

function formatGameRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    count: row.count_text,
    popular: Boolean(row.popular),
    desc: row.description,
    createdAt: row.created_at
  };
}

function formatProofRow(row) {
  if (!row) return null;
  const cCode = row.country_code || 'US';
  return {
    id: row.id,
    orderNumber: row.order_number,
    buyerUsername: row.buyer_username,
    buyerMasked: row.buyer_masked,
    buyerAvatar: row.buyer_avatar,
    countryCode: cCode,
    countryName: row.country_name || 'United States',
    countryFlag: FLAG_MAP[cCode] || '🇺🇸',
    staffName: row.staff_name,
    staffAvatar: row.staff_avatar,
    staffBadge: row.staff_badge,
    game: row.game,
    item: row.item,
    itemImage: row.item_image,
    proofScreenshot: row.proof_screenshot,
    amount: row.amount,
    timestamp: row.timestamp,
    verified: Boolean(row.verified),
    auditId: row.audit_id,
    auditSignature: row.audit_signature,
    tradeNotes: row.trade_notes,
    createdAt: row.created_at
  };
}

function verifyRequestAuth(req, requiredRoles = ['admin', 'staff']) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return { authorized: false, error: 'No token provided' };
  try {
    const parts = token.split('.');
    if (parts.length !== 2 && parts.length !== 3) {
      return { authorized: false, error: 'Invalid token format' };
    }
    const secret = process.env.JWT_SECRET || 'grandstock_production_jwt_key_2026_secure';
    let payload = null;

    if (parts.length === 2) {
      // 2-part format used by authServerPlugin createToken: [tokenData, signature]
      const [tokenData, signature] = parts;
      const expectedSig = crypto.createHmac('sha256', secret).update(tokenData).digest('base64url');
      if (signature !== expectedSig) return { authorized: false, error: 'Invalid token' };
      payload = JSON.parse(Buffer.from(tokenData, 'base64url').toString('utf-8'));
    } else {
      // 3-part standard JWT: [headerB64, payloadB64, signature]
      const [headerB64, payloadB64, signature] = parts;
      const expectedSig = crypto.createHmac('sha256', secret).update(headerB64 + '.' + payloadB64).digest('base64url');
      if (signature !== expectedSig) return { authorized: false, error: 'Invalid token' };
      payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
    }

    if (!payload) return { authorized: false, error: 'Invalid token' };
    if (payload.exp) {
      const now = payload.exp > 1e11 ? Date.now() : Math.floor(Date.now() / 1000);
      if (payload.exp < now) return { authorized: false, error: 'Token expired' };
    }
    if (requiredRoles && requiredRoles.length > 0) {
      const isOwner = Boolean(payload.isOwner ?? payload.is_owner);
      if (!requiredRoles.includes(payload.role) && !isOwner) {
        return { authorized: false, error: 'Insufficient permissions' };
      }
    }
    return { authorized: true, user: payload };
  } catch (e) {
    return { authorized: false, error: 'Token verification failed' };
  }
}

function formatTicketRow(tRow, messages = [], authUser = null, options = {}) {
  if (!tRow) return null;
  const cCode = tRow.country_code || 'US';
  const buyerObj = typeof tRow.buyer_json === 'string' ? JSON.parse(tRow.buyer_json || '{}') : (tRow.buyer_json || {});

  const isStaffOrAdmin = authUser && (authUser.role === 'admin' || authUser.role === 'staff' || Boolean(authUser.isOwner ?? authUser.is_owner));
  const isOwner = authUser && (
    (authUser.id && authUser.id === buyerObj.id) ||
    (authUser.email && buyerObj.email && authUser.email.toLowerCase() === buyerObj.email.toLowerCase()) ||
    (authUser.robloxUsername && buyerObj.robloxUsername && authUser.robloxUsername.toLowerCase() === buyerObj.robloxUsername.toLowerCase())
  );

  const canViewPin = Boolean(options.showPin || isStaffOrAdmin || isOwner);
  const canViewIp = Boolean(isStaffOrAdmin);

  return {
    id: tRow.id,
    orderId: tRow.order_id,
    status: tRow.status,
    statusStep: Number(tRow.status_step),
    game: tRow.game,
    items: typeof tRow.items_json === 'string' ? JSON.parse(tRow.items_json || '[]') : [],
    total: Number(tRow.total),
    pinCode: canViewPin ? tRow.pin_code : '****',
    paymentMethod: tRow.payment_method,
    buyer: buyerObj,
    staff: tRow.staff_json ? (typeof tRow.staff_json === 'string' ? JSON.parse(tRow.staff_json) : tRow.staff_json) : null,
    countryCode: cCode,
    countryName: tRow.country_name || 'United States',
    countryFlag: FLAG_MAP[cCode] || '🇺🇸',
    ipAddress: canViewIp ? (tRow.ip_address || '127.0.0.1') : maskIP(tRow.ip_address || '127.0.0.1'),
    ipMasked: maskIP(tRow.ip_address || '127.0.0.1'),
    auditId: tRow.audit_id,
    auditSignature: tRow.audit_signature,
    proofScreenshot: tRow.proof_screenshot,
    tradeNotes: tRow.trade_notes,
    createdAt: tRow.created_at,
    completedAt: tRow.completed_at,
    messages: messages.map(m => ({
      id: m.id,
      sender: m.sender,
      senderName: m.sender_name,
      avatar: m.avatar,
      badge: m.badge,
      text: m.text,
      attachments: typeof m.attachments_json === 'string' ? JSON.parse(m.attachments_json || '[]') : [],
      attachment: m.attachment || (typeof m.attachments_json === 'string' && JSON.parse(m.attachments_json || '[]')[0]) || null,
      hasActions: Boolean(m.has_actions),
      timestamp: m.timestamp,
      createdAt: m.created_at
    }))
  };
}

function cleanExpiredCoupons(db) {
  try {
    const nowIso = new Date().toISOString();
    db.prepare('DELETE FROM coupons WHERE expires_at IS NOT NULL AND expires_at < ?').run(nowIso);
  } catch (e) {}
}

let catalogCachePayload = null;
let catalogCacheTime = 0;
let catalogCacheEtag = null;
const CATALOG_CACHE_TTL = 30000; // 30 seconds TTL

export function invalidateCatalogCache() {
  catalogCachePayload = null;
  catalogCacheTime = 0;
  catalogCacheEtag = null;
}

export function catalogPlugin() {
  let syncScheduled = false;

  const setupMiddleware = (server) => {
    if (!syncScheduled) {
      syncScheduled = true;
      // Background auto-sync of Discord vouches on server start (5s delay) & every 15 mins
      setTimeout(() => {
        syncAllDiscordVouches().catch(err => console.error('[DiscordAutoSync] Startup error:', err.message));
      }, 5000);

      setInterval(() => {
        syncAllDiscordVouches().catch(err => console.error('[DiscordAutoSync] Interval error:', err.message));
      }, 15 * 60 * 1000);
    }

    server.middlewares.use(async (req, res, next) => {
      const sendJSON = (statusCode, data) => {
        res.statusCode = statusCode;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
      };

      const parseBody = () => new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
          body += chunk;
          if (body.length > 1048576) {
            req.destroy();
            return reject(new Error('Payload too large'));
          }
        });
        req.on('end', () => {
          try {
            resolve(body ? JSON.parse(body) : {});
          } catch (err) {
            reject(err);
          }
        });
        req.on('error', reject);
      });

      const pathname = (req.url || '').split('?')[0];

      // ------------------------------------------------------------------------
      // ------------------------------------------------------------------------
      // REAL-TIME DISCORD STATS (Live Online & Member Count from discord.gg/tanstock)
      // ------------------------------------------------------------------------
      if (pathname === '/api/discord/stats' && req.method === 'GET') {
        try {
          // Check cached stats (60s cache)
          const now = Date.now();
          if (global.__discordStatsCache && (now - global.__discordStatsCache.timestamp < 60000)) {
            return sendJSON(200, global.__discordStatsCache.data);
          }

          const https = await import('https');
          const options = {
            hostname: 'discord.com',
            path: '/api/v10/invites/tanstock?with_counts=true',
            method: 'GET',
            headers: { 'User-Agent': 'GrandStock/1.0' }
          };

          const discordReq = https.default.request(options, (discordRes) => {
            let body = '';
            discordRes.on('data', chunk => body += chunk);
            discordRes.on('end', () => {
              try {
                const data = JSON.parse(body);
                const onlineCount = data.approximate_presence_count || 226;
                const totalMembers = data.approximate_member_count || 2439;
                
                const formattedOnline = onlineCount >= 1000 
                  ? `${(onlineCount / 1000).toFixed(1)}k Online`
                  : `${onlineCount} Online`;

                const formattedTotal = totalMembers >= 1000
                  ? `${(totalMembers / 1000).toFixed(1)}k Members`
                  : `${totalMembers} Members`;

                const resultData = {
                  success: true,
                  inviteCode: 'tanstock',
                  inviteUrl: 'https://discord.gg/tanstock',
                  guildName: data.guild?.name || 'TANN STOCK',
                  onlineCount,
                  totalMembers,
                  formattedOnline,
                  formattedTotal
                };

                global.__discordStatsCache = {
                  timestamp: now,
                  data: resultData
                };

                return sendJSON(200, resultData);
              } catch (e) {
                return sendJSON(200, {
                  success: true,
                  inviteUrl: 'https://discord.gg/tanstock',
                  onlineCount: 226,
                  totalMembers: 2439,
                  formattedOnline: '226 Online',
                  formattedTotal: '2.4k Members'
                });
              }
            });
          });

          discordReq.on('error', () => {
            return sendJSON(200, {
              success: true,
              inviteUrl: 'https://discord.gg/tanstock',
              onlineCount: 226,
              totalMembers: 2439,
              formattedOnline: '226 Online',
              formattedTotal: '2.4k Members'
            });
          });

          discordReq.end();
          return;
        } catch (err) {
          return sendJSON(200, {
            success: true,
            inviteUrl: 'https://discord.gg/tanstock',
            onlineCount: 226,
            totalMembers: 2439,
            formattedOnline: '226 Online',
            formattedTotal: '2.4k Members'
          });
        }
      }

      // DYNAMIC PROMO CODES / COUPONS (SQLite & Auto-Expire)
      // ------------------------------------------------------------------------
      if (pathname === '/api/coupons/validate' && req.method === 'POST') {
        try {
          const { code, cartTotal } = await parseBody();
          if (!code) return sendJSON(400, { error: 'Coupon code is required' });

          const db = getDB();
          cleanExpiredCoupons(db);

          const cleanCode = code.trim().toUpperCase();
          const coupon = db.prepare('SELECT * FROM coupons WHERE code = ?').get(cleanCode);

          if (!coupon) {
            return sendJSON(404, { valid: false, error: 'Invalid promo code' });
          }

          if (coupon.is_active !== 1) {
            return sendJSON(400, { valid: false, error: 'This promo code is currently disabled' });
          }

          if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) {
            db.prepare('DELETE FROM coupons WHERE id = ?').run(coupon.id);
            return sendJSON(400, { valid: false, error: 'This promo code has expired' });
          }

          if (coupon.max_uses > 0 && coupon.used_count >= coupon.max_uses) {
            return sendJSON(400, { valid: false, error: 'This promo code has reached its maximum usage limit' });
          }

          const totalNum = Number(cartTotal || 0);
          if (coupon.min_spend > 0 && totalNum < coupon.min_spend) {
            return sendJSON(400, { valid: false, error: `Minimum order amount of $${coupon.min_spend.toFixed(2)} required for this code` });
          }

          const discountPct = Number(coupon.discount_pct);
          return sendJSON(200, {
            valid: true,
            coupon: {
              id: coupon.id,
              code: coupon.code,
              discountPct,
              discount: discountPct / 100,
              minSpend: Number(coupon.min_spend),
              description: `${discountPct}% OFF storewide`,
              expiresAt: coupon.expires_at
            },
            message: `Coupon ${coupon.code} applied: ${discountPct}% OFF`
          });
        } catch (e) {
          return sendJSON(500, { error: e.message });
        }
      }

      if (pathname === '/api/coupons/list' && req.method === 'GET') {
        try {
          const db = getDB();
          cleanExpiredCoupons(db);
          const coupons = db.prepare('SELECT * FROM coupons ORDER BY created_at DESC').all();
          return sendJSON(200, { success: true, coupons });
        } catch (e) {
          return sendJSON(500, { error: e.message });
        }
      }

      if (pathname === '/api/coupons/create' && req.method === 'POST') {
        const auth = verifyRequestAuth(req, ['admin']);
        if (!auth.authorized) {
          return sendJSON(401, { error: auth.error });
        }
        try {
          const body = await parseBody();
          const { code, discountPct, minSpend, maxUses, expiresAt, expiresInHours } = body;

          if (!code || !discountPct || discountPct <= 0 || discountPct > 100) {
            return sendJSON(400, { error: 'Valid coupon code and discount percentage (1-100%) are required' });
          }

          const db = getDB();
          const cleanCode = code.trim().toUpperCase();
          const existing = db.prepare('SELECT id FROM coupons WHERE code = ?').get(cleanCode);
          if (existing) {
            return sendJSON(409, { error: 'A coupon with this code already exists' });
          }

          let finalExpiry = expiresAt || null;
          if (expiresInHours && Number(expiresInHours) > 0) {
            finalExpiry = new Date(Date.now() + Number(expiresInHours) * 60 * 60 * 1000).toISOString();
          }

          const cId = `coup-${Date.now()}`;
          const now = new Date().toISOString();

          db.prepare(`
            INSERT INTO coupons (id, code, discount_pct, min_spend, max_uses, used_count, expires_at, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, 0, ?, 1, ?)
          `).run(
            cId,
            cleanCode,
            Number(discountPct),
            Number(minSpend || 0),
            Number(maxUses || 0),
            finalExpiry,
            now
          );

          const coupons = db.prepare('SELECT * FROM coupons ORDER BY created_at DESC').all();
          return sendJSON(201, { success: true, message: `Promo code ${cleanCode} created successfully`, coupons });
        } catch (e) {
          return sendJSON(500, { error: e.message });
        }
      }

      if (pathname === '/api/coupons/delete' && req.method === 'POST') {
        const auth = verifyRequestAuth(req, ['admin']);
        if (!auth.authorized) {
          return sendJSON(401, { error: auth.error });
        }
        try {
          const { id } = await parseBody();
          const db = getDB();
          db.prepare('DELETE FROM coupons WHERE id = ?').run(id);
          const coupons = db.prepare('SELECT * FROM coupons ORDER BY created_at DESC').all();
          return sendJSON(200, { success: true, coupons });
        } catch (e) {
          return sendJSON(500, { error: e.message });
        }
      }

      if (pathname === '/api/coupons/toggle' && req.method === 'POST') {
        const auth = verifyRequestAuth(req, ['admin']);
        if (!auth.authorized) {
          return sendJSON(401, { error: auth.error });
        }
        try {
          const { id, isActive } = await parseBody();
          const db = getDB();
          db.prepare('UPDATE coupons SET is_active = ? WHERE id = ?').run(isActive ? 1 : 0, id);
          const coupons = db.prepare('SELECT * FROM coupons ORDER BY created_at DESC').all();
          return sendJSON(200, { success: true, coupons });
        } catch (e) {
          return sendJSON(500, { error: e.message });
        }
      }

      // ------------------------------------------------------------------------
      // ANTI-SCAM FRAUD BLACKLIST (SQLite)
      // ------------------------------------------------------------------------
      if (pathname === '/api/blacklist/list' && req.method === 'GET') {
        try {
          const db = getDB();
          const blacklist = db.prepare('SELECT * FROM blacklist ORDER BY created_at DESC').all();
          return sendJSON(200, { success: true, blacklist });
        } catch (e) {
          return sendJSON(500, { error: e.message });
        }
      }

      if (pathname === '/api/blacklist/add' && req.method === 'POST') {
        const auth = verifyRequestAuth(req, ['admin']);
        if (!auth.authorized) {
          return sendJSON(401, { error: auth.error });
        }
        try {
          const body = await parseBody();
          const { type, value, reason, bannedBy } = body;

          if (!type || !value) {
            return sendJSON(400, { error: 'Blacklist type and target value are required' });
          }

          const db = getDB();
          const bId = `ban-${Date.now()}`;
          const cleanValue = value.trim();
          const now = new Date().toISOString();

          db.prepare(`
            INSERT INTO blacklist (id, type, value, reason, banned_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(bId, type, cleanValue, reason || 'Fraudulent activity / Scammer detected', bannedBy || 'Admin Security', now);

          const blacklist = db.prepare('SELECT * FROM blacklist ORDER BY created_at DESC').all();
          return sendJSON(201, { success: true, message: `Added ${cleanValue} to Fraud Shield Blacklist`, blacklist });
        } catch (e) {
          return sendJSON(500, { error: e.message });
        }
      }

      if (pathname === '/api/blacklist/remove' && req.method === 'POST') {
        const auth = verifyRequestAuth(req, ['admin']);
        if (!auth.authorized) {
          return sendJSON(401, { error: auth.error });
        }
        try {
          const { id } = await parseBody();
          const db = getDB();
          db.prepare('DELETE FROM blacklist WHERE id = ?').run(id);
          const blacklist = db.prepare('SELECT * FROM blacklist ORDER BY created_at DESC').all();
          return sendJSON(200, { success: true, blacklist });
        } catch (e) {
          return sendJSON(500, { error: e.message });
        }
      }

      // ------------------------------------------------------------------------
      // REAL ROBLOX USER & AVATAR LOOKUP PROXY
      // ------------------------------------------------------------------------
      if (pathname.startsWith('/api/roblox/user') && req.method === 'GET') {
        try {
          const urlObj = new URL(req.url, 'http://localhost:3000');
          const username = (urlObj.searchParams.get('username') || '').trim();

          if (!username) {
            return sendJSON(400, { error: 'Username is required' });
          }

          const postData = JSON.stringify({ usernames: [username], excludeBannedUsers: false });

          const userLookup = await new Promise((resolve, reject) => {
            const rReq = https.request('https://users.roblox.com/v1/usernames/users', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
              }
            }, (rRes) => {
              let data = '';
              rRes.on('data', chunk => data += chunk);
              rRes.on('end', () => {
                try { resolve(JSON.parse(data)); } catch (e) { resolve(null); }
              });
            });
            rReq.on('error', () => resolve(null));
            rReq.write(postData);
            rReq.end();
          });

          if (!userLookup || !userLookup.data || userLookup.data.length === 0) {
            return sendJSON(200, {
              success: false,
              notFound: true,
              username,
              avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}&backgroundColor=111218`
            });
          }

          const rUser = userLookup.data[0];
          const userId = rUser.id;

          const thumbLookup = await new Promise((resolve) => {
            https.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`, {
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
            }, (tRes) => {
              let data = '';
              tRes.on('data', chunk => data += chunk);
              tRes.on('end', () => {
                try { resolve(JSON.parse(data)); } catch (e) { resolve(null); }
              });
            }).on('error', () => resolve(null));
          });

          let avatarUrl = `https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=150&height=150&format=png`;
          if (thumbLookup && thumbLookup.data && thumbLookup.data.length > 0 && thumbLookup.data[0].imageUrl) {
            avatarUrl = thumbLookup.data[0].imageUrl;
          }

          return sendJSON(200, {
            success: true,
            notFound: false,
            username: rUser.name,
            displayName: rUser.displayName || rUser.name,
            id: userId,
            avatarUrl
          });
        } catch (e) {
          return sendJSON(500, { error: 'Roblox API proxy lookup failed' });
        }
      }

      // ------------------------------------------------------------------------
      // CATALOG ENDPOINTS (SQLite)
      // ------------------------------------------------------------------------
      if (pathname === '/api/catalog/data' && req.method === 'GET') {
        const now = Date.now();
        if (catalogCachePayload && catalogCacheEtag && (now - catalogCacheTime < CATALOG_CACHE_TTL)) {
          if (req.headers['if-none-match'] === catalogCacheEtag) {
            res.statusCode = 304;
            return res.end();
          }
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('ETag', catalogCacheEtag);
          res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
          return res.end(catalogCachePayload);
        }

        const db = getDB();
        const pRows = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
        const gRows = db.prepare('SELECT * FROM games ORDER BY popular DESC').all();
        const prRows = db.prepare('SELECT * FROM proofs ORDER BY created_at DESC').all();

        const dataObj = {
          products: pRows.map(formatProductRow),
          games: gRows.map(formatGameRow),
          proofs: prRows.map(formatProofRow)
        };

        const jsonString = JSON.stringify(dataObj);
        catalogCachePayload = jsonString;
        catalogCacheTime = now;
        catalogCacheEtag = `W/"${crypto.createHash('md5').update(jsonString).digest('hex')}"`;

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('ETag', catalogCacheEtag);
        res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
        return res.end(jsonString);
      }

      if ((pathname === '/api/catalog/products' || pathname === '/api/catalog/products/update') && (req.method === 'POST' || req.method === 'PUT')) {
        const auth = verifyRequestAuth(req, ['admin']);
        if (!auth.authorized) {
          return sendJSON(401, { error: auth.error });
        }
        try {
          const body = await parseBody();
          const db = getDB();
          const pId = body.id || `prod-${Date.now()}`;
          const perksJson = JSON.stringify(Array.isArray(body.perks) ? body.perks : []);
          const now = new Date().toISOString();

          db.prepare(`
            INSERT INTO products (id, slug, name, game_id, game_name, category, rarity, original_price, price, stock, instant_delivery, image, description, perks, trade_requirements, popular, badge, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              slug = excluded.slug,
              name = excluded.name,
              game_id = excluded.game_id,
              game_name = excluded.game_name,
              category = excluded.category,
              rarity = excluded.rarity,
              original_price = excluded.original_price,
              price = excluded.price,
              stock = excluded.stock,
              instant_delivery = excluded.instant_delivery,
              image = excluded.image,
              description = excluded.description,
              perks = excluded.perks,
              trade_requirements = excluded.trade_requirements,
              popular = excluded.popular,
              badge = excluded.badge
          `).run(
            pId,
            body.slug || pId,
            body.name,
            body.gameId || 'blox-fruits',
            body.gameName || 'Blox Fruits',
            body.category || 'permanent-fruits',
            body.rarity || 'mythical',
            Number(body.originalPrice || body.price || 19.99),
            Number(body.price || 19.99),
            Number(body.stock || 10),
            body.instantDelivery !== false ? 1 : 0,
            body.image || '',
            body.description || '',
            perksJson,
            body.tradeRequirements || '',
            body.popular ? 1 : 0,
            body.badge || '',
            now
          );

          invalidateCatalogCache();
          const allProducts = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
          const savedRow = db.prepare('SELECT * FROM products WHERE id = ?').get(pId);

          return sendJSON(200, {
            success: true,
            product: formatProductRow(savedRow),
            products: allProducts.map(formatProductRow)
          });
        } catch (err) {
          return sendJSON(500, { error: err.message });
        }
      }

      if ((pathname === '/api/catalog/products/delete' || pathname === '/api/catalog/products') && (req.method === 'POST' || req.method === 'DELETE')) {
        const auth = verifyRequestAuth(req, ['admin']);
        if (!auth.authorized) {
          return sendJSON(401, { error: auth.error });
        }
        try {
          const body = await parseBody();
          const db = getDB();
          const id = body.id || (new URL(req.url, 'http://localhost:3000').searchParams.get('id'));
          if (!id) return sendJSON(400, { error: 'Product ID required' });
          db.prepare('DELETE FROM products WHERE id = ?').run(id);
          invalidateCatalogCache();
          const allProducts = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
          return sendJSON(200, { success: true, products: allProducts.map(formatProductRow) });
        } catch (err) {
          return sendJSON(500, { error: err.message });
        }
      }

      if (pathname === '/api/catalog/games' && (req.method === 'POST' || req.method === 'PUT')) {
        const auth = verifyRequestAuth(req, ['admin']);
        if (!auth.authorized) {
          return sendJSON(401, { error: auth.error });
        }
        try {
          const body = await parseBody();
          const db = getDB();
          const gId = body.id || `game-${Date.now()}`;
          const now = new Date().toISOString();

          db.prepare(`
            INSERT INTO games (id, name, icon, count_text, popular, description, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              name = excluded.name,
              icon = excluded.icon,
              count_text = excluded.count_text,
              popular = excluded.popular,
              description = excluded.description
          `).run(
            gId,
            body.name,
            body.icon || '🎮',
            body.count || `${body.itemCount || 10} items`,
            body.popular ? 1 : 0,
            body.desc || body.description || '',
            now
          );

          invalidateCatalogCache();
          const allGames = db.prepare('SELECT * FROM games ORDER BY popular DESC').all();
          return sendJSON(200, { success: true, games: allGames.map(formatGameRow) });
        } catch (err) {
          return sendJSON(500, { error: err.message });
        }
      }

      if ((pathname === '/api/catalog/games/delete' || pathname === '/api/catalog/games') && (req.method === 'POST' || req.method === 'DELETE')) {
        const auth = verifyRequestAuth(req, ['admin']);
        if (!auth.authorized) {
          return sendJSON(401, { error: auth.error });
        }
        try {
          const body = await parseBody();
          const db = getDB();
          const id = body.id || (new URL(req.url, 'http://localhost:3000').searchParams.get('id'));
          if (!id) return sendJSON(400, { error: 'Game ID required' });
          db.prepare('DELETE FROM games WHERE id = ?').run(id);
          invalidateCatalogCache();
          const allGames = db.prepare('SELECT * FROM games ORDER BY popular DESC').all();
          return sendJSON(200, { success: true, games: allGames.map(formatGameRow) });
        } catch (err) {
          return sendJSON(500, { error: err.message });
        }
      }

      if (pathname === '/api/catalog/import' && req.method === 'POST') {
        const auth = verifyRequestAuth(req, ['admin']);
        if (!auth.authorized) {
          return sendJSON(401, { error: auth.error });
        }
        try {
          const body = await parseBody();
          const db = getDB();
          const products = body.products || [];
          const games = body.games || [];
          const now = new Date().toISOString();

          db.exec('BEGIN TRANSACTION;');
          try {
            for (const p of products) {
              const pId = p.id || `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
              const perksJson = JSON.stringify(Array.isArray(p.perks) ? p.perks : []);
              db.prepare(`
                INSERT INTO products (id, slug, name, game_id, game_name, category, rarity, original_price, price, stock, instant_delivery, image, description, perks, trade_requirements, popular, badge, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                  slug = excluded.slug, name = excluded.name, game_id = excluded.game_id, game_name = excluded.game_name,
                  category = excluded.category, rarity = excluded.rarity, original_price = excluded.original_price, price = excluded.price,
                  stock = excluded.stock, instant_delivery = excluded.instant_delivery, image = excluded.image, description = excluded.description,
                  perks = excluded.perks, trade_requirements = excluded.trade_requirements, popular = excluded.popular, badge = excluded.badge
              `).run(
                pId, p.slug || pId, p.name, p.gameId || 'blox-fruits', p.gameName || 'Blox Fruits', p.category || 'items',
                p.rarity || 'common', Number(p.originalPrice || p.price || 0), Number(p.price || 0), Number(p.stock || 0),
                p.instantDelivery !== false ? 1 : 0, p.image || '', p.description || '', perksJson, p.tradeRequirements || '',
                p.popular ? 1 : 0, p.badge || '', now
              );
            }
            for (const g of games) {
              const gId = g.id || `game-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
              db.prepare(`
                INSERT INTO games (id, name, icon, count_text, popular, description, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                  name = excluded.name, icon = excluded.icon, count_text = excluded.count_text,
                  popular = excluded.popular, description = excluded.description
              `).run(gId, g.name, g.icon || '🎮', g.count || `${g.itemCount || 10} items`, g.popular ? 1 : 0, g.desc || g.description || '', now);
            }
            db.exec('COMMIT;');
          } catch (e) {
            db.exec('ROLLBACK;');
            throw e;
          }
          const allProducts = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
          const allGames = db.prepare('SELECT * FROM games ORDER BY popular DESC').all();
          return sendJSON(200, { success: true, products: allProducts.map(formatProductRow), games: allGames.map(formatGameRow) });
        } catch (err) {
          return sendJSON(500, { error: err.message });
        }
      }

      if (pathname === '/api/catalog/reset' && req.method === 'POST') {
        const auth = verifyRequestAuth(req, ['admin']);
        if (!auth.authorized) {
          return sendJSON(401, { error: auth.error });
        }
        return sendJSON(200, { success: true, message: 'Catalog reset authorized' });
      }

      // ------------------------------------------------------------------------
      // TICKETS & 2-WAY CHAT (SQLite with IP, Country & Anti-Scam Shield)
      // ------------------------------------------------------------------------
      if (pathname === '/api/tickets/list' && req.method === 'GET') {
        const auth = verifyRequestAuth(req, ['admin', 'staff']);
        if (!auth.authorized) {
          return sendJSON(401, { error: auth.error });
        }
        const db = getDB();
        const tRows = db.prepare('SELECT * FROM tickets ORDER BY created_at DESC').all();
        const tickets = tRows.map(t => {
          const mRows = db.prepare('SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC').all(t.id);
          return formatTicketRow(t, mRows, auth.user);
        });
        return sendJSON(200, { success: true, tickets });
      }

      if (pathname === '/api/tickets/create' && req.method === 'POST') {
        try {
          const body = await parseBody();
          const db = getDB();
          const tId = body.id || `TICKET-${body.orderId || Date.now()}`;
          const orderId = body.orderId || `GS-${Date.now()}`;
          const now = new Date().toISOString();

          const clientIP = getClientIP(req);
          const geo = resolveCountry(req, body);

          const buyerObj = body.buyerUser || body.buyer || {};
          const buyerRoblox = (buyerObj.robloxUsername || buyerObj.username || '').trim();
          const buyerEmail = (buyerObj.email || '').trim();

          // 🛡️ ANTI-SCAM FRAUD SHIELD CHECK
          const banCheck = db.prepare(`
            SELECT * FROM blacklist
            WHERE (type = 'ip_address' AND value = ?)
               OR (type = 'roblox_username' AND LOWER(value) = LOWER(?))
               OR (type = 'email' AND LOWER(value) = LOWER(?))
          `).get(clientIP, buyerRoblox, buyerEmail);

          if (banCheck) {
            return sendJSON(403, {
              error: `🛡️ Security Shield: Your account/IP has been flagged (${banCheck.reason || 'Fraud Prevention'}). Order declined.`
            });
          }

          // If coupon was used, increment usage counter in SQLite
          if (body.couponCode) {
            try {
              db.prepare('UPDATE coupons SET used_count = used_count + 1 WHERE code = ?').run(body.couponCode.trim().toUpperCase());
            } catch (e) {}
          }

          const itemsJson = JSON.stringify(body.items || []);
          const buyerJson = JSON.stringify(buyerObj);
          const primaryItem = (body.items && body.items[0]) || {};
          const game = primaryItem.gameName || 'Blox Fruits';

          const insertResult = db.prepare(`
            INSERT INTO tickets (id, order_id, status, status_step, game, items_json, total, pin_code, payment_method, buyer_json, staff_json, ip_address, country_code, country_name, audit_id, audit_signature, proof_screenshot, trade_notes, created_at)
            VALUES (?, ?, 'UNCLAIMED', 1, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, NULL, '', ?)
            ON CONFLICT(order_id) DO NOTHING
          `).run(
            tId,
            orderId,
            game,
            itemsJson,
            Number(body.total || 0),
            String(body.pinCode || '0000'),
            body.paymentMethod || 'Credit Card',
            buyerJson,
            clientIP,
            geo.code,
            geo.name,
            `GS-AUDIT-${orderId}`,
            `SIG-GS-2026-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
            now
          );

          const isBrandNewOrder = insertResult.changes > 0;

          const msgId = `msg-sys-${Date.now()}`;
          const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const itemsDesc = body.items && body.items.length > 0 ? body.items.map(i => i.name).join(', ') : 'Roblox Items';
          const sysText = `[SYSTEM] Payment authorized via ${body.paymentMethod || 'Stripe'}. Ticket #${tId} opened for [${itemsDesc}]. Verified Buyer Region: ${geo.flag} ${geo.name}. Broadcasted to live staff queue.`;

          db.prepare(`
            INSERT INTO ticket_messages (id, ticket_id, sender, sender_name, avatar, badge, text, attachments_json, attachment, has_actions, timestamp, created_at)
            VALUES (?, ?, 'system', 'GrandStock Bot', NULL, 'AUTOMATED ESCROW', ?, '[]', NULL, 0, ?, ?)
          `).run(msgId, tId, sysText, timeStr, now);

          const tRow = db.prepare('SELECT * FROM tickets WHERE id = ?').get(tId);
          const mRows = db.prepare('SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC').all(tId);

          // 🚀 DISPATCH REAL-TIME DISCORD WEBHOOK NOTIFICATION ONLY FOR BRAND NEW ORDERS
          if (isBrandNewOrder) {
            try {
              const origin = req.headers.origin || `http://${req.headers.host || 'localhost:3000'}`;
              sendDiscordOrderNotification({
                orderId,
                ticketId: tId,
                buyerUser: buyerObj,
                items: body.items || [],
                total: Number(body.total || 0),
                currency: body.currency || 'USD',
                paymentMethod: body.paymentMethod || 'Credit Card',
                pinCode: String(body.pinCode || '0000'),
                geo,
                clientIP,
                origin
              }).catch(e => console.error('[Discord Webhook Error]:', e));
            } catch (e) {}
          }

          return sendJSON(201, { success: true, ticket: formatTicketRow(tRow, mRows, null, { showPin: true }) });
        } catch (err) {
          return sendJSON(500, { error: err.message });
        }
      }

      if (pathname === '/api/tickets/claim' && req.method === 'POST') {
        const auth = verifyRequestAuth(req, ['admin', 'staff']);
        if (!auth.authorized) {
          return sendJSON(401, { error: auth.error });
        }
        try {
          const body = await parseBody();
          const db = getDB();
          const tRow = db.prepare('SELECT * FROM tickets WHERE id = ? OR order_id = ?').get(body.ticketId, body.ticketId);

          if (!tRow) return sendJSON(404, { error: 'Ticket not found' });

          const staffJson = JSON.stringify(body.staffUser || { name: 'Staff Agent', robloxUsername: 'GS_Staff' });
          db.prepare(`
            UPDATE tickets SET status = 'CLAIMED', status_step = 2, staff_json = ? WHERE id = ?
          `).run(staffJson, tRow.id);

          if (body.initialStaffMessage) {
            const msgId = `msg-claim-${Date.now()}`;
            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const now = new Date().toISOString();
            db.prepare(`
              INSERT INTO ticket_messages (id, ticket_id, sender, sender_name, avatar, badge, text, attachments_json, attachment, has_actions, timestamp, created_at)
              VALUES (?, ?, 'staff', ?, ?, ?, ?, '[]', NULL, 1, ?, ?)
            `).run(
              msgId,
              tRow.id,
              body.staffUser?.name || 'Staff Agent',
              body.staffUser?.avatar || '',
              body.staffUser?.badge || 'VERIFIED STAFF',
              body.initialStaffMessage,
              timeStr,
              now
            );
          }

          const updatedTicket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(tRow.id);
          const mRows = db.prepare('SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC').all(tRow.id);

          return sendJSON(200, { success: true, ticket: formatTicketRow(updatedTicket, mRows, auth.user) });
        } catch (err) {
          return sendJSON(500, { error: err.message });
        }
      }

      if ((pathname === '/api/tickets/message' || pathname === '/api/chat/send') && req.method === 'POST') {
        try {
          const body = await parseBody();
          const ticketId = body.ticketId || body.id;
          const message = body.message || body;
          const db = getDB();

          const tRow = db.prepare('SELECT * FROM tickets WHERE id = ? OR order_id = ?').get(ticketId, ticketId);
          if (!tRow) return sendJSON(404, { error: 'Ticket not found' });

          const auth = verifyRequestAuth(req, null);
          if (!auth.authorized) {
            return sendJSON(401, { error: auth.error });
          }

          const isStaffOrAdmin = ['admin', 'staff'].includes(auth.user.role) || Boolean(auth.user.isOwner ?? auth.user.is_owner);
          const buyerObj = typeof tRow.buyer_json === 'string' ? JSON.parse(tRow.buyer_json || '{}') : (tRow.buyer_json || {});
          const isTicketOwner = (auth.user.id && auth.user.id === buyerObj.id) ||
            (auth.user.email && buyerObj.email && auth.user.email.toLowerCase() === buyerObj.email.toLowerCase()) ||
            (auth.user.robloxUsername && buyerObj.robloxUsername && auth.user.robloxUsername.toLowerCase() === buyerObj.robloxUsername.toLowerCase());

          if (!isStaffOrAdmin && !isTicketOwner) {
            return sendJSON(403, { error: 'Insufficient permissions: only staff, admin, or ticket owner can send messages' });
          }

          if (tRow.status === 'DELIVERED') {
            return sendJSON(400, { error: 'This trade is finalized and delivered. Chat is closed.' });
          }

          const msgId = message.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          const timeStr = message.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const attachJson = JSON.stringify(message.attachments || (message.attachment ? [message.attachment] : []));
          const singleAttach = message.attachment || (message.attachments && message.attachments[0]) || null;
          const now = new Date().toISOString();

          db.prepare(`
            INSERT INTO ticket_messages (id, ticket_id, sender, sender_name, avatar, badge, text, attachments_json, attachment, has_actions, timestamp, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            msgId,
            tRow.id,
            message.sender || (isStaffOrAdmin ? 'staff' : 'buyer'),
            message.senderName || (isStaffOrAdmin ? (auth.user.name || 'Staff Agent') : (buyerObj.name || 'Player')),
            message.avatar || '',
            message.badge || (isStaffOrAdmin ? 'VERIFIED STAFF' : ''),
            message.text || '',
            attachJson,
            singleAttach,
            message.hasActions ? 1 : 0,
            timeStr,
            now
          );

          const updatedTicket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(tRow.id);
          const mRows = db.prepare('SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC').all(tRow.id);

          return sendJSON(200, { success: true, ticket: formatTicketRow(updatedTicket, mRows, auth.user) });
        } catch (err) {
          return sendJSON(500, { error: err.message });
        }
      }

      if (pathname === '/api/tickets/deliver' && req.method === 'POST') {
        const auth = verifyRequestAuth(req, ['admin', 'staff']);
        if (!auth.authorized) {
          return sendJSON(401, { error: auth.error });
        }
        try {
          const body = await parseBody();
          const db = getDB();
          const tRow = db.prepare('SELECT * FROM tickets WHERE id = ? OR order_id = ?').get(body.ticketId, body.ticketId);

          if (!tRow) return sendJSON(404, { error: 'Ticket not found' });

          const now = new Date().toISOString();
          const staffJson = body.staffUser ? JSON.stringify(body.staffUser) : tRow.staff_json;
          const tradeNotes = body.tradeNotes || 'In-game trade hand-delivered and verified.';

          db.prepare(`
            UPDATE tickets SET status = 'DELIVERED', status_step = 5, proof_screenshot = ?, trade_notes = ?, completed_at = ?, staff_json = ? WHERE id = ?
          `).run(body.proofScreenshot, tradeNotes, now, staffJson, tRow.id);

          // Update staff trades completed in users table if staff assigned
          if (body.staffUser?.id) {
            try {
              db.prepare('UPDATE users SET trades_completed = trades_completed + 1 WHERE id = ?').run(body.staffUser.id);
            } catch (e) {}
          }

          const msgId = `msg-sys-done-${Date.now()}`;
          const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const staffObj = body.staffUser || (tRow.staff_json ? JSON.parse(tRow.staff_json) : {});
          const sysDone = `✅ In-game trade confirmed & delivered by ${staffObj.name || 'Staff'}. Order #${tRow.order_id} completed with verified trade screenshot.`;

          db.prepare(`
            INSERT INTO ticket_messages (id, ticket_id, sender, sender_name, avatar, badge, text, attachments_json, attachment, has_actions, timestamp, created_at)
            VALUES (?, ?, 'system', 'GrandStock Security', NULL, 'DELIVERY VERIFIED', ?, '[]', NULL, 0, ?, ?)
          `).run(msgId, tRow.id, sysDone, timeStr, now);

          if (body.proofScreenshot) {
            const items = typeof tRow.items_json === 'string' ? JSON.parse(tRow.items_json || '[]') : [];
            const primaryItem = items[0] || { name: 'Roblox Item', gameName: tRow.game || 'Blox Fruits' };
            const buyer = typeof tRow.buyer_json === 'string' ? JSON.parse(tRow.buyer_json || '{}') : {};
            const proofId = `PROOF-${tRow.order_id}`;
            const buyerMasked = buyer.robloxUsername ? `${buyer.robloxUsername.slice(0, 3)}***` : 'Player***';

            db.prepare(`
              INSERT INTO proofs (id, order_number, buyer_username, buyer_masked, buyer_avatar, country_code, country_name, staff_name, staff_avatar, staff_badge, game, item, item_image, proof_screenshot, amount, timestamp, verified, audit_id, audit_signature, trade_notes, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Just now', 1, ?, ?, ?, ?)
              ON CONFLICT(order_number) DO UPDATE SET
                proof_screenshot = excluded.proof_screenshot,
                trade_notes = excluded.trade_notes,
                staff_name = excluded.staff_name,
                staff_avatar = excluded.staff_avatar,
                country_code = excluded.country_code,
                country_name = excluded.country_name
            `).run(
              proofId,
              tRow.order_id,
              buyer.robloxUsername || 'Customer',
              buyerMasked,
              buyer.avatar || '',
              tRow.country_code || 'US',
              tRow.country_name || 'United States',
              staffObj.name || 'Agent Alex',
              staffObj.avatar || '',
              staffObj.badge || 'VERIFIED STAFF',
              primaryItem.gameName || tRow.game || 'Blox Fruits',
              items.length > 1 ? `${primaryItem.name} + ${items.length - 1} more items` : (primaryItem.name || 'Roblox Item'),
              primaryItem.image || '/items/bf-perm-kitsune.png',
              body.proofScreenshot,
              `$${Number(tRow.total || 0).toFixed(2)}`,
              tRow.audit_id || `GS-AUDIT-${tRow.order_id}`,
              tRow.audit_signature || 'SIG-GS-2026-VERIFIED',
              tradeNotes,
              now
            );
          }

          const updatedTicket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(tRow.id);
          const mRows = db.prepare('SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC').all(tRow.id);

          return sendJSON(200, { success: true, ticket: formatTicketRow(updatedTicket, mRows, auth.user) });
        } catch (err) {
          return sendJSON(500, { error: err.message });
        }
      }

      // ------------------------------------------------------------------------
      // ------------------------------------------------------------------------
      // DISCORD VOUCHES IMPORT & SYNC (SQLite)
      // ------------------------------------------------------------------------
      if (pathname === '/api/vouches/import' && req.method === 'POST') {
        const auth = verifyRequestAuth(req, ['admin', 'staff']);
        if (!auth.authorized) {
          return sendJSON(401, { error: auth.error });
        }
        try {
          const body = await parseBody();
          const db = getDB();
          const now = new Date().toISOString();
          const geo = resolveCountry(req, body);

          const authorName = body.authorName || body.buyerName || 'Discord Customer';
          const authorAvatar = sanitizeDiscordAvatar(body.avatar || body.authorAvatar) || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';
          const comment = body.comment || body.message || body.text || 'Vouch! Fast delivery, trusted service ⭐⭐⭐⭐⭐';
          const game = body.game || 'Blox Fruits';
          const item = body.item || 'In-Game Items';
          const rating = Number(body.rating || 5);
          const proofScreenshot = body.screenshot || body.proofScreenshot || '';

          // 1. Insert into reviews table
          const rId = `rev-disc-${Date.now()}`;
          const maskedName = authorName.length > 4 ? `${authorName.substring(0, 3)}***` : `${authorName}***`;

          db.prepare(`
            INSERT INTO reviews (id, buyer_name, buyer_masked, avatar, game, rating, comment, country_code, verified, timestamp, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'Discord Vouch', ?)
          `).run(rId, authorName, maskedName, authorAvatar, game, rating, comment, body.countryCode || geo.code, now);

          // 2. If screenshot provided, also add to proofs table
          if (proofScreenshot) {
            const orderNum = `GS-DISC-${Math.floor(100000 + Math.random() * 900000)}`;
            const pId = `PROOF-${orderNum}`;
            db.prepare(`
              INSERT INTO proofs (id, order_number, buyer_username, buyer_masked, buyer_avatar, country_code, country_name, staff_name, staff_avatar, staff_badge, game, item, item_image, proof_screenshot, amount, timestamp, verified, audit_id, audit_signature, trade_notes, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, 'Discord Staff', NULL, 'DISCORD VOUCH', ?, ?, '/items/bf-perm-kitsune.png', ?, '$19.99', 'Discord Verified', 1, ?, 'SIG-GS-DISCORD-VOUCH', ?, ?)
            `).run(
              pId,
              orderNum,
              authorName,
              maskedName,
              authorAvatar,
              body.countryCode || geo.code,
              body.countryName || geo.name,
              game,
              item,
              proofScreenshot,
              `GS-AUDIT-${orderNum}`,
              comment,
              now
            );
          }

          const reviews = db.prepare('SELECT * FROM reviews ORDER BY created_at DESC').all();
          const proofs = db.prepare('SELECT * FROM proofs ORDER BY created_at DESC').all().map(formatProofRow);

          return sendJSON(201, {
            success: true,
            message: `Discord vouch from ${authorName} successfully imported to website!`,
            reviews,
            proofs
          });
        } catch (err) {
          return sendJSON(500, { error: err.message });
        }
      }

      if (pathname === '/api/vouches/bulk-import' && req.method === 'POST') {
        const auth = verifyRequestAuth(req, ['admin', 'staff']);
        if (!auth.authorized) {
          return sendJSON(401, { error: auth.error });
        }
        try {
          const body = await parseBody();
          const db = getDB();
          const now = new Date().toISOString();
          const vouchesList = body.vouches || [];

          if (!Array.isArray(vouchesList) || vouchesList.length === 0) {
            return sendJSON(400, { error: 'No vouches provided for bulk import' });
          }

          let reviewsInserted = 0;
          let proofsInserted = 0;

          db.exec('BEGIN TRANSACTION;');
          try {
            for (const v of vouchesList) {
              const authorName = v.authorName || v.buyerName || 'Discord Customer';
              const authorAvatar = sanitizeDiscordAvatar(v.authorAvatar || v.avatar) || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';
              const comment = v.comment || v.message || v.text || 'Verified Discord Vouch ⭐⭐⭐⭐⭐';
              const game = v.game || 'Blox Fruits';
              const item = v.item || 'Roblox In-Game Item';
              const rating = Number(v.rating || 5);
              const proofScreenshot = v.screenshot || v.proofScreenshot || '';
              const timeStr = v.timestamp || 'Discord Vouch';
              const createdAt = v.createdAt || now;

              const rId = `rev-disc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
              const maskedName = authorName.length > 4 ? `${authorName.substring(0, 3)}***` : `${authorName}***`;

              db.prepare(`
                INSERT INTO reviews (id, buyer_name, buyer_masked, avatar, game, rating, comment, country_code, verified, timestamp, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'US', 1, ?, ?)
              `).run(rId, authorName, maskedName, authorAvatar, game, rating, comment, timeStr, createdAt);
              reviewsInserted++;

              if (proofScreenshot) {
                const orderNum = `GS-DISC-${Math.floor(100000 + Math.random() * 900000)}`;
                const pId = `PROOF-${orderNum}`;
                db.prepare(`
                  INSERT INTO proofs (id, order_number, buyer_username, buyer_masked, buyer_avatar, country_code, country_name, staff_name, staff_avatar, staff_badge, game, item, item_image, proof_screenshot, amount, timestamp, verified, audit_id, audit_signature, trade_notes, created_at)
                  VALUES (?, ?, ?, ?, ?, 'US', 'United States', 'Discord Staff', NULL, 'DISCORD VOUCH', ?, ?, '/items/bf-perm-kitsune.png', ?, '$19.99', 'Discord Verified', 1, ?, 'SIG-GS-DISCORD-VOUCH', ?, ?)
                `).run(
                  pId,
                  orderNum,
                  authorName,
                  maskedName,
                  authorAvatar,
                  game,
                  item,
                  proofScreenshot,
                  `GS-AUDIT-${orderNum}`,
                  comment,
                  createdAt
                );
                proofsInserted++;
              }
            }
            db.exec('COMMIT;');
          } catch (e) {
            db.exec('ROLLBACK;');
            throw e;
          }

          const totalReviews = db.prepare('SELECT COUNT(*) as count FROM reviews').get().count;
          const totalProofs = db.prepare('SELECT COUNT(*) as count FROM proofs').get().count;

          return sendJSON(201, {
            success: true,
            message: `Successfully bulk-imported ${reviewsInserted} Discord reviews and ${proofsInserted} trade screenshots!`,
            reviewsInserted,
            proofsInserted,
            totalReviews,
            totalProofs
          });
        } catch (err) {
          return sendJSON(500, { error: err.message });
        }
      }

      // PROOFS & REVIEWS (SQLite)
      // ------------------------------------------------------------------------
      if (pathname === '/api/proofs/list' && req.method === 'GET') {
        const db = getDB();
        const prRows = db.prepare('SELECT * FROM proofs ORDER BY created_at DESC').all();
        return sendJSON(200, { proofs: prRows.map(formatProofRow) });
      }

      if (pathname === '/api/proofs/create' && req.method === 'POST') {
        const auth = verifyRequestAuth(req, ['admin', 'staff']);
        if (!auth.authorized) {
          return sendJSON(401, { error: auth.error });
        }
        try {
          const body = await parseBody();
          const db = getDB();
          const orderNum = body.orderNumber || `GS-${Date.now()}`;
          const pId = body.id || `PROOF-${orderNum}`;
          const now = new Date().toISOString();
          const geo = resolveCountry(req, body);

          db.prepare(`
            INSERT INTO proofs (id, order_number, buyer_username, buyer_masked, buyer_avatar, country_code, country_name, staff_name, staff_avatar, staff_badge, game, item, item_image, proof_screenshot, amount, timestamp, verified, audit_id, audit_signature, trade_notes, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(order_number) DO UPDATE SET
              proof_screenshot = excluded.proof_screenshot,
              trade_notes = excluded.trade_notes
          `).run(
            pId,
            orderNum,
            body.buyerUsername || 'Customer',
            body.buyerMasked || 'Cust***',
            body.buyerAvatar || '',
            body.countryCode || geo.code,
            body.countryName || geo.name,
            body.staffName || 'Agent Alex',
            body.staffAvatar || '',
            body.staffBadge || 'VERIFIED STAFF',
            body.game || 'Blox Fruits',
            body.item || 'Roblox Item',
            body.itemImage || '/items/bf-perm-kitsune.png',
            body.proofScreenshot || '',
            body.amount || '$19.99',
            body.timestamp || 'Just now',
            body.verified !== false ? 1 : 0,
            body.auditId || `GS-AUDIT-${orderNum}`,
            body.auditSignature || 'SIG-GS-2026-VERIFIED',
            body.tradeNotes || 'Trade verified.',
            now
          );

          invalidateCatalogCache();
          const prRows = db.prepare('SELECT * FROM proofs ORDER BY created_at DESC').all();
          return sendJSON(201, { success: true, proofs: prRows.map(formatProofRow) });
        } catch (err) {
          return sendJSON(500, { error: err.message });
        }
      }

      if (pathname === '/api/proofs/delete' && req.method === 'POST') {
        const auth = verifyRequestAuth(req, ['admin', 'staff']);
        if (!auth.authorized) {
          return sendJSON(401, { error: auth.error });
        }
        try {
          const { id } = await parseBody();
          const db = getDB();
          db.prepare('DELETE FROM proofs WHERE id = ? OR order_number = ?').run(id, id);
          invalidateCatalogCache();
          const prRows = db.prepare('SELECT * FROM proofs ORDER BY created_at DESC').all();
          return sendJSON(200, { success: true, proofs: prRows.map(formatProofRow) });
        } catch (err) {
          return sendJSON(500, { error: err.message });
        }
      }

      if (pathname === '/api/reviews/list' && req.method === 'GET') {
        const db = getDB();
        const rRows = db.prepare('SELECT * FROM reviews ORDER BY created_at DESC').all();
        return sendJSON(200, { success: true, reviews: rRows });
      }

      if (pathname === '/api/reviews/create' && req.method === 'POST') {
        const auth = verifyRequestAuth(req, ['admin', 'staff']);
        if (!auth.authorized) {
          return sendJSON(401, { error: auth.error });
        }
        try {
          const body = await parseBody();
          const db = getDB();
          const rId = `rev-${Date.now()}`;
          const now = new Date().toISOString();
          const geo = resolveCountry(req, body);

          db.prepare(`
            INSERT INTO reviews (id, buyer_name, buyer_masked, avatar, game, rating, comment, country_code, verified, timestamp, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Just now', ?)
          `).run(
            rId,
            body.buyerName || 'Buyer',
            body.buyerMasked || 'Buy***',
            body.avatar || '',
            body.game || 'Blox Fruits',
            Number(body.rating || 5),
            body.comment || 'Great trade!',
            body.countryCode || geo.code,
            1,
            now
          );

          const rRows = db.prepare('SELECT * FROM reviews ORDER BY created_at DESC').all();
          return sendJSON(201, { success: true, reviews: rRows });
        } catch (err) {
          return sendJSON(500, { error: err.message });
        }
      }

      next();
    });
  };

  return {
    name: 'catalog-backend-middleware',
    configureServer: setupMiddleware,
    configurePreviewServer: setupMiddleware
  };
}
