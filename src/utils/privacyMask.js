// ============================================================================
// GRANDSTOCK PRIVACY & ANTI-SCRAPING SHIELD
// Automatically masks usernames, emails, Discord tags, and transaction hashes
// to prevent Roblox anti-cheat bot scraping and identity exposure.
// ============================================================================

export function maskRobloxUsername(username) {
  if (!username || typeof username !== 'string') return 'Player***';
  const clean = username.trim();
  if (clean.length <= 3) return `${clean}***`;

  // Standard marketplace masking: keep first 2-3 characters and last 1-2 characters
  if (clean.length <= 5) {
    return `${clean.slice(0, 2)}***${clean.slice(-1)}`;
  }
  if (clean.length <= 8) {
    return `${clean.slice(0, 3)}***${clean.slice(-2)}`;
  }
  // For longer names (e.g. ShadowNinja99 -> Shad***99)
  return `${clean.slice(0, 4)}***${clean.slice(-2)}`;
}

export function maskEmail(email) {
  if (!email || !email.includes('@')) return 'user***@***.com';
  const [user, domain] = email.split('@');
  const maskedUser = user.length <= 3 ? `${user[0]}***` : `${user.slice(0, 2)}***${user.slice(-1)}`;
  const [domName, ext] = domain.split('.');
  const maskedDom = domName ? `${domName.slice(0, 1)}***` : '***';
  return `${maskedUser}@${maskedDom}.${ext || 'com'}`;
}

export function maskDiscordTag(discord) {
  if (!discord) return 'User#****';
  const clean = discord.trim();
  if (clean.includes('#')) {
    const [name, tag] = clean.split('#');
    return `${name.slice(0, 2)}***#${tag}`;
  }
  if (clean.length <= 4) return `${clean.slice(0, 1)}***`;
  return `${clean.slice(0, 3)}***${clean.slice(-2)}`;
}

export function maskTransactionId(txid) {
  if (!txid) return 'TX-****-****';
  const clean = txid.trim();
  if (clean.length <= 10) return clean;
  return `${clean.slice(0, 6)}...${clean.slice(-4)}`;
}
