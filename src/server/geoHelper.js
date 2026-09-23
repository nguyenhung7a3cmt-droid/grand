/**
 * GRANDSTOCK SERVER-SIDE IP & COUNTRY GEOLOCATION ENGINE
 * Captures real IP, Cloudflare IP, and resolves Country/Flag for orders and audits.
 */

const COUNTRY_MAP = {
  'VN': { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  'US': { code: 'US', name: 'United States', flag: '🇺🇸' },
  'PH': { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  'TH': { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
  'ID': { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  'MY': { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  'SG': { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  'GB': { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  'CA': { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  'AU': { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  'DE': { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  'FR': { code: 'FR', name: 'France', flag: '🇫🇷' },
  'JP': { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  'KR': { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  'BR': { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  'MX': { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  'ES': { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  'IT': { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  'NL': { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  'SE': { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  'PL': { code: 'PL', name: 'Poland', flag: '🇵🇱' },
  'TR': { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
  'IN': { code: 'IN', name: 'India', flag: '🇮🇳' }
};

const TIMEZONE_TO_COUNTRY = {
  'Asia/Ho_Chi_Minh': { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  'Asia/Saigon': { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  'Asia/Bangkok': { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
  'Asia/Manila': { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  'Asia/Singapore': { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  'Asia/Jakarta': { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  'Asia/Tokyo': { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  'Asia/Seoul': { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  'America/New_York': { code: 'US', name: 'United States', flag: '🇺🇸' },
  'America/Chicago': { code: 'US', name: 'United States', flag: '🇺🇸' },
  'America/Denver': { code: 'US', name: 'United States', flag: '🇺🇸' },
  'America/Los_Angeles': { code: 'US', name: 'United States', flag: '🇺🇸' },
  'America/Toronto': { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  'America/Vancouver': { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  'America/Sao_Paulo': { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  'America/Mexico_City': { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  'Europe/London': { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  'Europe/Berlin': { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  'Europe/Paris': { code: 'FR', name: 'France', flag: '🇫🇷' },
  'Europe/Madrid': { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  'Europe/Rome': { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  'Europe/Amsterdam': { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  'Australia/Sydney': { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  'Australia/Melbourne': { code: 'AU', name: 'Australia', flag: '🇦🇺' }
};

export function getClientIP(req) {
  const cfIp = req.headers['cf-connecting-ip'];
  if (cfIp) return String(cfIp).trim();

  const xRealIp = req.headers['x-real-ip'];
  if (xRealIp) return String(xRealIp).trim();

  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor) {
    const firstIp = String(xForwardedFor).split(',')[0].trim();
    if (firstIp) return firstIp;
  }

  const socketIp = req.socket?.remoteAddress || '127.0.0.1';
  return socketIp.replace(/^::ffff:/, '');
}

export function maskIP(ip) {
  if (!ip || ip === '127.0.0.1' || ip === '::1') return '127.0.0.1 (Localhost)';
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.***.***`;
  }
  return ip.slice(0, 8) + '***';
}

export function resolveCountry(req, body = {}) {
  // 1. Cloudflare IP Country Header
  const cfCountry = req.headers['cf-ipcountry'];
  if (cfCountry && COUNTRY_MAP[cfCountry.toUpperCase()]) {
    return COUNTRY_MAP[cfCountry.toUpperCase()];
  }

  // 2. Client sent timezone / country in request body
  const tz = body.clientTimezone || body.timezone;
  if (tz && TIMEZONE_TO_COUNTRY[tz]) {
    return TIMEZONE_TO_COUNTRY[tz];
  }

  if (body.clientCountryCode && COUNTRY_MAP[body.clientCountryCode.toUpperCase()]) {
    return COUNTRY_MAP[body.clientCountryCode.toUpperCase()];
  }

  // 3. Header Accept-Language analysis
  const lang = req.headers['accept-language'] || '';
  if (lang.includes('vi') || lang.includes('VN')) {
    return COUNTRY_MAP['VN'];
  } else if (lang.includes('fil') || lang.includes('PH')) {
    return COUNTRY_MAP['PH'];
  } else if (lang.includes('th') || lang.includes('TH')) {
    return COUNTRY_MAP['TH'];
  } else if (lang.includes('ja') || lang.includes('JP')) {
    return COUNTRY_MAP['JP'];
  } else if (lang.includes('ko') || lang.includes('KR')) {
    return COUNTRY_MAP['KR'];
  } else if (lang.includes('en-GB')) {
    return COUNTRY_MAP['GB'];
  } else if (lang.includes('en-AU')) {
    return COUNTRY_MAP['AU'];
  } else if (lang.includes('en-CA')) {
    return COUNTRY_MAP['CA'];
  }

  // Default fallback: US
  return COUNTRY_MAP['US'];
}
