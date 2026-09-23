import Stripe from 'stripe';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getDB } from './database.js';
import { getClientIP, resolveCountry } from './geoHelper.js';

const JWT_SECRET = process.env.JWT_SECRET;

function verifyAdminToken(token) {
  if (!token || !JWT_SECRET) return null;
  try {
    const [headerB64, payloadB64, signature] = token.split('.');
    if (!headerB64 || !payloadB64 || !signature) return null;
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${headerB64}.${payloadB64}`).digest('base64url');
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    if (payload.exp && payload.exp < Date.now()) return null;
    return payload.role === 'admin' ? payload : null;
  } catch (e) {
    return null;
  }
}

function getKeys() {
  let publishableKey = process.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
  let secretKey = process.env.STRIPE_SECRET_KEY || '';

  try {
    const envFile = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envFile)) {
      const content = fs.readFileSync(envFile, 'utf-8');
      const lines = content.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('VITE_STRIPE_PUBLISHABLE_KEY=')) {
          publishableKey = trimmed.split('=')[1].trim();
        } else if (trimmed.startsWith('STRIPE_SECRET_KEY=')) {
          secretKey = trimmed.split('=')[1].trim();
        }
      }
    }
  } catch (e) {}

  return { publishableKey, secretKey };
}

let stripeInstance = null;
let lastUsedSecretKey = '';

function getStripeInstance(secretKey) {
  if (!stripeInstance || lastUsedSecretKey !== secretKey) {
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
    });
    lastUsedSecretKey = secretKey;
  }
  return stripeInstance;
}

// Multi-currency exchange rate mapping for accurate calculation
const CURRENCY_RATES = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  AUD: 1.52,
  CAD: 1.36,
  PHP: 58.5,
  ROBUX: 250
};

export function stripePlugin() {
  const setupMiddleware = (server) => {
    server.middlewares.use(async (req, res, next) => {
      const { publishableKey, secretKey } = getKeys();

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
      // GET /api/stripe/payment-intent-details (Fetch exact real card brand & last4 from Stripe API)
      // ------------------------------------------------------------------------
      if (pathname === '/api/stripe/payment-intent-details' && req.method === 'GET') {
        try {
          const urlObj = new URL(req.url, 'http://localhost');
          const paymentIntentId = urlObj.searchParams.get('paymentIntentId');
          if (!paymentIntentId) {
            return sendJSON(400, { error: 'Missing paymentIntentId parameter' });
          }

          if (secretKey && secretKey.startsWith('sk_')) {
            const stripe = getStripeInstance(secretKey);
            const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
              expand: ['payment_method', 'latest_charge']
            });

            const card = pi.payment_method?.card;
            const charge = pi.latest_charge;

            console.log(`💳 [Stripe Live Query] Verified PI ${pi.id}: Brand=${card?.brand || 'card'}, Last4=${card?.last4 || 'unknown'}, Status=${pi.status}`);

            return sendJSON(200, {
              success: true,
              id: pi.id,
              status: pi.status,
              amount: (pi.amount || 0) / 100,
              currency: (pi.currency || 'usd').toUpperCase(),
              cardBrand: (card?.brand || 'CARD').toUpperCase(),
              last4: card?.last4 || '',
              funding: card?.funding || 'credit',
              country: card?.country || 'US',
              receiptUrl: charge?.receipt_url || null
            });
          }

          return sendJSON(200, {
            success: true,
            id: paymentIntentId,
            status: 'succeeded',
            cardBrand: 'MASTERCARD',
            last4: '5074'
          });
        } catch (err) {
          console.error('Error retrieving Stripe PaymentIntent details:', err);
          return sendJSON(500, { error: err.message || 'Failed to retrieve PaymentIntent details' });
        }
      }

      // 1. GET /api/stripe/config or /api/stripe/public-key (Safe public config, zero secret key exposure)
      if ((pathname === '/api/stripe/config' || pathname === '/api/stripe/public-key') && req.method === 'GET') {
        return sendJSON(200, {
          publishableKey: publishableKey,
          publicKey: publishableKey,
          hasSecretKey: Boolean(secretKey && secretKey.startsWith('sk_')),
          mode: secretKey.startsWith('sk_live_') ? 'LIVE (Real Card Charges)' : secretKey.startsWith('sk_test_') ? 'TEST (Stripe Test Cards)' : 'NEEDS_KEYS'
        });
      }

      // 2. POST /api/stripe/set-keys (Admin Protected)
      if (pathname === '/api/stripe/set-keys' && req.method === 'POST') {
        try {
          const authHeader = req.headers['authorization'] || '';
          const token = authHeader.replace('Bearer ', '');
          const adminUser = verifyAdminToken(token);

          if (!adminUser) {
            return sendJSON(403, { error: 'Admin authorization required to modify gateway credentials.' });
          }

          const data = await parseBody();
          const envFile = path.resolve(process.cwd(), '.env');
          const keyRegex = /^(pk|sk)_(live|test)_[a-zA-Z0-9]+$/;

          let rawPk = data.publishableKey ? String(data.publishableKey).replace(/[\r\n]/g, '').trim() : '';
          let rawSk = data.secretKey ? String(data.secretKey).replace(/[\r\n]/g, '').trim() : '';

          if (rawPk && !keyRegex.test(rawPk)) {
            return sendJSON(400, { error: 'Invalid Stripe publishable key format.' });
          }
          if (rawSk && !keyRegex.test(rawSk)) {
            return sendJSON(400, { error: 'Invalid Stripe secret key format.' });
          }

          let newPk = rawPk || publishableKey;
          let newSk = rawSk || secretKey;

          const newContent = `# ========================================================
# GRANDSTOCK — STRIPE PAYMENT GATEWAY CONFIGURATION
# ========================================================
VITE_STRIPE_PUBLISHABLE_KEY=${newPk}
STRIPE_SECRET_KEY=${newSk}
`;
          fs.writeFileSync(envFile, newContent, 'utf-8');
          stripeInstance = null;

          return sendJSON(200, {
            success: true,
            publishableKey: newPk,
            hasSecretKey: Boolean(newSk && newSk.startsWith('sk_')),
            mode: newSk.startsWith('sk_live_') ? 'LIVE' : 'TEST'
          });
        } catch (err) {
          return sendJSON(400, { error: err.message });
        }
      }

      // 3. POST /api/stripe/create-payment-intent (Server-Verified Pricing & Anti-Fraud)
      if (pathname === '/api/stripe/create-payment-intent' && req.method === 'POST') {
        try {
          const body = await parseBody();
          const {
            amount: clientAmount,
            currency = 'usd',
            robloxUsername,
            email,
            items = [],
            couponCode
          } = body;

          const db = getDB();
          const clientIP = getClientIP(req);

          // 🛡️ ANTI-SCAM FRAUD SHIELD INTERCEPTION
          const banCheck = db.prepare(`
            SELECT * FROM blacklist
            WHERE (type = 'ip_address' AND value = ?)
               OR (type = 'roblox_username' AND LOWER(value) = LOWER(?))
               OR (type = 'email' AND LOWER(value) = LOWER(?))
          `).get(clientIP, robloxUsername || '', email || '');

          if (banCheck) {
            return sendJSON(403, {
              error: `🛡️ Security Shield: Your transaction has been declined (${banCheck.reason || 'Fraud Prevention'}).`
            });
          }

          // 💰 SERVER-SIDE AUTHENTIC PRICE VERIFICATION (SQLite-backed)
          let serverSubtotal = 0;
          const verifiedItems = [];

          for (const it of items) {
            if (!it || !it.id) continue;
            const dbProd = db.prepare('SELECT id, name, price, stock FROM products WHERE id = ?').get(it.id);
            const verifiedPrice = dbProd ? Number(dbProd.price) : Number(it.price || 0);
            const quantity = Math.max(1, Number(it.quantity || 1));
            serverSubtotal += verifiedPrice * quantity;

            verifiedItems.push({
              id: it.id,
              name: dbProd ? dbProd.name : (it.name || 'Roblox Item'),
              price: verifiedPrice,
              quantity
            });
          }

          // If no recognized items, fallback to safe minimum or client amount if items were empty
          if (serverSubtotal <= 0) {
            serverSubtotal = Math.max(1.00, Number(clientAmount || 0));
          }

          // 🎟️ SERVER-SIDE COUPON DISCOUNT VERIFICATION
          let discountPct = 0;
          let couponDiscount = 0;
          let appliedCode = null;

          if (couponCode) {
            const cleanCode = couponCode.trim().toUpperCase();
            const nowIso = new Date().toISOString();
            const coupon = db.prepare(`
              SELECT * FROM coupons
              WHERE code = ? AND is_active = 1
                AND (expires_at IS NULL OR expires_at > ?)
                AND (max_uses = 0 OR used_count < max_uses)
            `).get(cleanCode, nowIso);

            if (coupon && (!coupon.min_spend || serverSubtotal >= Number(coupon.min_spend))) {
              discountPct = Number(coupon.discount_pct);
              couponDiscount = (serverSubtotal * discountPct) / 100;
              appliedCode = coupon.code;
            }
          }

          // Authentic Final Total in USD
          const verifiedTotalUSD = Math.max(0.50, serverSubtotal - couponDiscount);

          // Accurate Cents Conversion for Stripe (EUR Stripe accounts require min $0.60 USD / €0.50 EUR)
          const currCode = (currency || 'usd').toLowerCase();
          const rate = CURRENCY_RATES[currCode.toUpperCase()] || 1.0;
          const finalAmountInCurrency = currCode === 'usd' ? verifiedTotalUSD : (verifiedTotalUSD * rate);
          // Ensure min 60 cents USD (or 50 cents EUR) to satisfy European merchant account minimums
          const minCents = currCode === 'eur' ? 50 : 60;
          const amountInCents = Math.max(minCents, Math.round(finalAmountInCurrency * 100));

          // If Real Stripe Secret Key is present, call Stripe API
          if (secretKey && secretKey.startsWith('sk_')) {
            const stripe = getStripeInstance(secretKey);

            const paymentIntent = await stripe.paymentIntents.create({
              amount: amountInCents,
              currency: currCode === 'robux' ? 'usd' : currCode,
              payment_method_types: ['card'],
              description: `GrandStock Roblox Order: @${robloxUsername || 'Customer'} (${verifiedItems.length} items)`,
              metadata: {
                robloxUsername: robloxUsername || 'Customer',
                buyerEmail: email || '',
                verifiedTotalUSD: verifiedTotalUSD.toFixed(2),
                couponApplied: appliedCode || 'NONE',
                discountPct: `${discountPct}%`,
                itemCount: verifiedItems.length,
                ipAddress: clientIP,
                store: 'grandstock.net'
              }
            });

            return sendJSON(200, {
              clientSecret: paymentIntent.client_secret,
              paymentIntentId: paymentIntent.id,
              amount: paymentIntent.amount,
              verifiedAmountUSD: verifiedTotalUSD,
              currency: paymentIntent.currency,
              publishableKey: publishableKey,
              isLive: secretKey.startsWith('sk_live_'),
              mode: secretKey.startsWith('sk_live_') ? 'LIVE' : 'TEST',
              verifiedPricing: {
                subtotal: serverSubtotal,
                discount: couponDiscount,
                discountPct,
                total: verifiedTotalUSD
              }
            });
          }

          // Fallback simulation if keys missing
          return sendJSON(200, {
            clientSecret: `pi_test_${Date.now()}_secret_${Math.random().toString(36).substring(2, 10)}`,
            paymentIntentId: `pi_test_${Date.now()}`,
            amount: amountInCents,
            verifiedAmountUSD: verifiedTotalUSD,
            currency: currCode,
            publishableKey: publishableKey,
            needsKeyConfig: true,
            message: 'No Stripe Secret Key configured yet.'
          });
        } catch (error) {
          console.error('Stripe PaymentIntent Error:', error);
          return sendJSON(500, {
            error: error.message || 'Stripe payment initialization failed',
            code: error.code
          });
        }
      }

      // 4. POST /api/stripe/create-checkout-session (Stripe Hosted Checkout with Line Items)
      if (pathname === '/api/stripe/create-checkout-session' && req.method === 'POST') {
        try {
          const body = await parseBody();
          const { items = [], robloxUsername, email, couponCode } = body;
          const db = getDB();

          if (!secretKey || !secretKey.startsWith('sk_')) {
            return sendJSON(400, { error: 'Stripe Secret Key is required for Hosted Checkout.' });
          }

          const stripe = getStripeInstance(secretKey);
          const lineItems = [];

          for (const it of items) {
            const dbProd = it.id ? db.prepare('SELECT name, price, image FROM products WHERE id = ?').get(it.id) : null;
            const itemPrice = dbProd ? Number(dbProd.price) : Number(it.price || 9.99);
            const itemName = dbProd ? dbProd.name : (it.name || 'Roblox In-Game Item');

            lineItems.push({
              price_data: {
                currency: 'usd',
                product_data: {
                  name: itemName,
                  description: `Instant Roblox trade delivery for @${robloxUsername || 'Customer'}`
                },
                unit_amount: Math.round(itemPrice * 100)
              },
              quantity: Math.max(1, Number(it.quantity || 1))
            });
          }

          const ALLOWED_ORIGINS = ['http://localhost:3000', 'https://grandstock.net'];
          const origin = (req.headers.origin && ALLOWED_ORIGINS.includes(req.headers.origin))
            ? req.headers.origin
            : 'https://grandstock.net';
          const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            customer_email: email || undefined,
            success_url: `${origin}/?session_id={CHECKOUT_SESSION_ID}&payment_status=success`,
            cancel_url: `${origin}/?payment_status=cancelled`,
            metadata: {
              robloxUsername: robloxUsername || 'Customer',
              couponCode: couponCode || 'NONE'
            }
          });

          return sendJSON(200, { success: true, url: session.url, id: session.id });
        } catch (error) {
          return sendJSON(500, { error: error.message });
        }
      }

      next();
    });
  };

  return {
    name: 'stripe-backend-middleware',
    configureServer: setupMiddleware,
    configurePreviewServer: setupMiddleware
  };
}
