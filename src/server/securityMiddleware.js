// ============================================================================
// GRANDSTOCK ANTI-DDOS & RATE LIMITING SECURITY ENGINE
// Protects endpoints against volumetric flooding, brute force attacks, and scrape bots.
// ============================================================================

const ipRequestMap = new Map();
const MAX_MAP_SIZE = 10000;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_GENERAL_REQUESTS_PER_MIN = 80;
const MAX_AUTH_REQUESTS_PER_MIN = 12;

function pruneRateLimitMap() {
  while (ipRequestMap.size > MAX_MAP_SIZE) {
    const oldestKey = ipRequestMap.keys().next().value;
    if (oldestKey === undefined) break;
    ipRequestMap.delete(oldestKey);
  }
}

// Periodic cleanup of stale IPs
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of ipRequestMap.entries()) {
    if (now - data.startTime > RATE_LIMIT_WINDOW_MS) {
      ipRequestMap.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW_MS);

// getClientIP: prefers req.socket.remoteAddress when not behind a trusted proxy.
// Note: x-forwarded-for should only be trusted behind Cloudflare/nginx.
function getClientIP(req) {
  const isTrustedProxy = process.env.TRUSTED_PROXY === 'true';
  if (isTrustedProxy) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const firstIp = String(forwarded).split(',')[0].trim();
      if (firstIp) return firstIp;
    }
  }
  const socketIp = req.socket?.remoteAddress;
  if (socketIp) {
    return socketIp.replace(/^::ffff:/, '');
  }
  return '127.0.0.1';
}

export function securityRateLimiter() {
  return (req, res, next) => {
    // Apply Security Response Headers (Anti-Clickjacking, Anti-Sniffing, Anti-Iframe, CSP, HSTS)
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' ws: wss: https: https://api.stripe.com https://*.trycloudflare.com https://*.roblox.com https://*.rbxcdn.com https://api.binance.com https://discord.com https://cdn.discordapp.com; frame-src https://js.stripe.com https://www.paypal.com;");
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.removeHeader('X-Powered-By');

    // Only apply rate limiting on /api/ endpoints
    if (!req.url || !req.url.startsWith('/api/')) {
      return next();
    }

    const ip = getClientIP(req);
    const now = Date.now();
    const isAuth = req.url.startsWith('/api/auth/');

    let ipRecord = ipRequestMap.get(ip);
    if (!ipRecord || (now - ipRecord.startTime > RATE_LIMIT_WINDOW_MS)) {
      if (ipRequestMap.size >= MAX_MAP_SIZE) {
        pruneRateLimitMap();
      }
      ipRecord = { count: 1, authCount: isAuth ? 1 : 0, startTime: now };
      ipRequestMap.set(ip, ipRecord);
    } else {
      ipRecord.count += 1;
      if (isAuth) ipRecord.authCount += 1;
    }

    const limit = isAuth ? MAX_AUTH_REQUESTS_PER_MIN : MAX_GENERAL_REQUESTS_PER_MIN;
    const currentUsage = isAuth ? ipRecord.authCount : ipRecord.count;

    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - currentUsage));

    // Exceeded Rate Limit -> HTTP 429 Too Many Requests
    if (currentUsage > limit) {
      res.statusCode = 429;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Retry-After', '30');
      res.end(JSON.stringify({
        error: 'Too Many Requests (Anti-DDoS Shield Active)',
        message: 'Rate limit exceeded. Please wait 30 seconds before retrying.',
        code: 'RATE_LIMIT_EXCEEDED'
      }));
      return;
    }

    next();
  };
}
