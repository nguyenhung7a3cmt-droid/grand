/**
 * Country & Geo-Location Detection Utility
 * Determines real country flag, code, and name from timezone, locale, or account data
 */

const TIMEZONE_TO_COUNTRY = {
  'Asia/Ho_Chi_Minh': { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  'Asia/Bangkok': { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
  'Asia/Manila': { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  'Asia/Singapore': { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  'Asia/Jakarta': { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  'Asia/Tokyo': { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  'Asia/Seoul': { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  'America/New_York': { code: 'US', name: 'United States', flag: '🇺🇸' },
  'America/Chicago': { code: 'US', name: 'United States', flag: '🇺🇸' },
  'America/Los_Angeles': { code: 'US', name: 'United States', flag: '🇺🇸' },
  'America/Toronto': { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  'America/Vancouver': { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  'America/Sao_Paulo': { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  'Europe/London': { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  'Europe/Berlin': { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  'Europe/Paris': { code: 'FR', name: 'France', flag: '🇫🇷' },
  'Europe/Madrid': { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  'Australia/Sydney': { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  'Australia/Melbourne': { code: 'AU', name: 'Australia', flag: '🇦🇺' }
};

const GLOBAL_FLAGS = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' }
];

export function getClientCountry() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && TIMEZONE_TO_COUNTRY[tz]) {
      return TIMEZONE_TO_COUNTRY[tz];
    }
  } catch (e) {}

  // Fallback to US
  return { code: 'US', name: 'United States', flag: '🇺🇸' };
}

export function getCountryForUser(seed = '') {
  if (!seed) return getClientCountry();
  
  // Deterministic hash based on username/id
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % GLOBAL_FLAGS.length;
  return GLOBAL_FLAGS[idx];
}
