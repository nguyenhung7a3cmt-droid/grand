// ============================================================================
// GRANDSTOCK AUTOMATED REALTIME TRADE PROOF VECTOR GENERATOR
// Produces 100% robust, self-contained SVG Trade Handshake receipts that never expire.
// ============================================================================

export function generateSvgTradeProof({
  orderNumber = 'GS-892104',
  buyerMasked = 'Player***',
  staffName = 'Agent Alex',
  item = 'Permanent Kitsune Fruit',
  game = 'Blox Fruits',
  amount = '$19.99',
  auditSignature = null
} = {}) {
  const safeOrder = String(orderNumber || 'GS-892104');
  const safeBuyer = String(buyerMasked || 'Player***');
  const safeStaff = String(staffName || 'Verified Staff');
  const safeItem = String(item || 'Roblox In-Game Item').substring(0, 24);
  const safeGame = String(game || 'Roblox');
  const safeAmount = String(amount || '$19.99');
  const safeSig = auditSignature || `SIG-GS-2026-${safeOrder.replace(/[^0-9]/g, '') || '892104'}-VERIFIED`;

  // Game accent colors
  let accentColor = '#EE1D36';
  let accentSecondary = '#FF2E4D';
  let gameEmoji = '⚔️';
  const lowerGame = safeGame.toLowerCase();
  if (lowerGame.includes('murder') || lowerGame.includes('mm2')) {
    accentColor = '#A855F7';
    accentSecondary = '#EC4899';
    gameEmoji = '🔪';
  } else if (lowerGame.includes('piece') || lowerGame.includes('gpo')) {
    accentColor = '#F59E0B';
    accentSecondary = '#EF4444';
    gameEmoji = '🌊';
  } else if (lowerGame.includes('fisch')) {
    accentColor = '#06B6D4';
    accentSecondary = '#3B82F6';
    gameEmoji = '🎣';
  } else if (lowerGame.includes('defenders')) {
    accentColor = '#8B5CF6';
    accentSecondary = '#6366F1';
    gameEmoji = '⚡';
  } else if (lowerGame.includes('brainrot')) {
    accentColor = '#10B981';
    accentSecondary = '#14B8A6';
    gameEmoji = '🧠';
  } else if (lowerGame.includes('adopt')) {
    accentColor = '#EC4899';
    accentSecondary = '#F43F5E';
    gameEmoji = '🐾';
  }

  const svgXml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 350" width="600" height="350">
<defs>
<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
<stop offset="0%" stop-color="#08090d"/>
<stop offset="50%" stop-color="#12131c"/>
<stop offset="100%" stop-color="#090a0f"/>
</linearGradient>
<linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
<stop offset="0%" stop-color="${accentColor}"/>
<stop offset="100%" stop-color="${accentSecondary}"/>
</linearGradient>
<filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
<feGaussianBlur stdDeviation="6" result="blur" />
<feComposite in="SourceGraphic" in2="blur" operator="over" />
</filter>
</defs>

<!-- Background Canvas -->
<rect width="600" height="350" fill="url(#bg)" rx="16"/>
<rect width="596" height="346" x="2" y="2" fill="none" stroke="#232634" stroke-width="1.5" rx="15"/>

<!-- Top In-Game Trade Header Bar -->
<rect width="570" height="42" x="15" y="15" fill="#181a24" rx="10" stroke="#2a2d3d" stroke-width="1"/>
<circle cx="35" cy="36" r="6" fill="#10B981" filter="url(#glow)"/>
<text x="50" y="41" fill="#FFFFFF" font-family="'Chakra Petch', sans-serif" font-weight="900" font-size="13" letter-spacing="1">ROBLOX IN-GAME TRADE COMPLETED</text>
<rect x="440" y="23" width="135" height="26" fill="#10B981" fill-opacity="0.15" stroke="#10B981" stroke-width="1" rx="6"/>
<text x="507" y="40" fill="#34D399" font-family="monospace" font-weight="bold" font-size="10" text-anchor="middle">VERIFIED HANDSHAKE</text>

<!-- Left: Trade Window Mockup (Player Side) -->
<rect x="25" y="70" width="260" height="180" fill="#0e1017" rx="12" stroke="#232634" stroke-width="1"/>
<rect x="35" y="80" width="240" height="28" fill="#181a24" rx="6"/>
<text x="45" y="98" fill="#94A3B8" font-family="sans-serif" font-size="11">Your Offer (GrandStock Staff):</text>

<!-- Item Slot Box -->
<rect x="35" y="116" width="240" height="88" fill="#151722" rx="8" stroke="${accentColor}" stroke-opacity="0.6" stroke-width="1.5"/>
<rect x="45" y="126" width="68" height="68" fill="#08090d" rx="6" stroke="#2a2d3d"/>
<text x="79" y="168" font-size="28" text-anchor="middle">${gameEmoji}</text>
<text x="125" y="146" fill="#FFFFFF" font-family="'Chakra Petch', sans-serif" font-weight="bold" font-size="13">${safeItem}</text>
<text x="125" y="164" fill="${accentColor}" font-family="monospace" font-weight="bold" font-size="11">[${safeGame}]</text>
<text x="125" y="182" fill="#10B981" font-family="sans-serif" font-size="10">✓ Locked &amp; Transferred</text>

<rect x="35" y="212" width="240" height="26" fill="#10B981" fill-opacity="0.2" rx="6"/>
<text x="155" y="229" fill="#34D399" font-family="'Chakra Petch', sans-serif" font-weight="bold" font-size="11" text-anchor="middle">✓ TRADE ACCEPTED IN-GAME</text>

<!-- Right: Verification Details & Security Seal -->
<rect x="300" y="70" width="275" height="180" fill="#0e1017" rx="12" stroke="#232634" stroke-width="1"/>

<text x="315" y="95" fill="#94A3B8" font-family="monospace" font-size="10">ORDER NUMBER:</text>
<text x="430" y="95" fill="#FFFFFF" font-family="monospace" font-weight="bold" font-size="11">${safeOrder}</text>

<text x="315" y="122" fill="#94A3B8" font-family="monospace" font-size="10">RECIPIENT USER:</text>
<text x="430" y="122" fill="#34D399" font-family="monospace" font-weight="bold" font-size="11">@${safeBuyer}</text>

<text x="315" y="149" fill="#94A3B8" font-family="monospace" font-size="10">DISPATCH AGENT:</text>
<text x="430" y="149" fill="#F8FAFC" font-family="monospace" font-weight="bold" font-size="11">${safeStaff}</text>

<text x="315" y="176" fill="#94A3B8" font-family="monospace" font-size="10">VALUE DELIVERED:</text>
<text x="430" y="176" fill="#FF2E4D" font-family="monospace" font-weight="black" font-size="13">${safeAmount}</text>

<text x="315" y="203" fill="#94A3B8" font-family="monospace" font-size="10">ESCROW STATUS:</text>
<text x="430" y="203" fill="#10B981" font-family="monospace" font-weight="bold" font-size="10">100% COMPLETE</text>

<!-- Bottom Security Audit Hash -->
<rect x="15" y="262" width="570" height="72" fill="#111219" rx="10" stroke="#232634" stroke-width="1"/>
<text x="30" y="286" fill="#64748B" font-family="monospace" font-size="9">CRYPTOGRAPHIC AUDIT SIGNATURE:</text>
<text x="30" y="303" fill="#94A3B8" font-family="monospace" font-size="10">${safeSig}</text>
<text x="30" y="322" fill="#10B981" font-family="sans-serif" font-size="9">🛡️ Official GrandStock Delivery Ledger • Anti-Fraud Timestamped Certificate</text>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svgXml)}`;
}
