import https from 'https';
import fs from 'fs';
import path from 'path';

function getWebhookUrl() {
  let webhookUrl = process.env.DISCORD_ORDER_WEBHOOK || '';

  try {
    const envFile = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envFile)) {
      const content = fs.readFileSync(envFile, 'utf-8');
      const lines = content.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('DISCORD_ORDER_WEBHOOK=')) {
          webhookUrl = trimmed.split('=')[1].trim();
        }
      }
    }
  } catch (e) {}

  return webhookUrl || 'https://discord.com/api/webhooks/1544661286439096402/wsHkgNjYK-iu3Ww2Dq0yOkEafAEdJqytm7xy2NAYYyxExixr1szOwJgY29v1xYEbtXNk';
}

/**
 * Dispatch real-time Discord Embed notification for newly created orders
 */
export async function sendDiscordOrderNotification({
  orderId,
  ticketId,
  buyerUser,
  items = [],
  total,
  currency = 'USD',
  paymentMethod,
  pinCode,
  geo = {},
  clientIP = '127.0.0.1',
  origin = 'http://localhost:3000'
}) {
  const webhookUrl = getWebhookUrl();
  if (!webhookUrl) {
    console.log('[Discord Notifier] No webhook URL configured.');
    return false;
  }

  const buyerRoblox = (buyerUser?.robloxUsername || buyerUser?.username || 'Customer').trim();
  const buyerEmail = buyerUser?.email || 'N/A';
  const discordHandle = buyerUser?.discordHandle || buyerUser?.discord || '';
  const totalUSD = typeof total === 'number' ? total.toFixed(2) : String(total || '0.00');

  // Format Items List
  const itemsText = items.length > 0
    ? items.map(it => `• **${it.quantity || 1}x** ${it.name || 'Roblox Item'} ($${Number(it.price || 0).toFixed(2)})`).join('\n')
    : '• 1x Roblox In-Game Item';

  const primaryItem = items[0] || {};
  const gameName = primaryItem.gameName || 'Blox Fruits';

  // Direct Ticket Staff Jump Link
  const ticketUrl = `${origin}/?ticket=${ticketId || orderId}`;

  const payload = JSON.stringify({
    username: 'GrandStock Order Dispatcher',
    avatar_url: 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/shield-check.png',
    embeds: [{
      title: `🛒 NEW ROBLOX ORDER CREATED — #${ticketId || orderId}`,
      description: `**Order #${orderId}** was created and broadcasted to the on-duty staff queue!`,
      url: ticketUrl,
      color: 15605046, // GrandStock Crimson Red #EE1D36
      fields: [
        {
          name: '👤 Buyer Roblox Username',
          value: `[@${buyerRoblox}](https://www.roblox.com/search/users?keyword=${encodeURIComponent(buyerRoblox)})`,
          inline: true
        },
        {
          name: '📍 Region / Country',
          value: `${geo.flag || '🌐'} ${geo.name || 'United States'} (\`${clientIP}\`)`,
          inline: true
        },
        {
          name: '💰 Total Amount',
          value: `**$${totalUSD} ${currency}**`,
          inline: true
        },
        {
          name: '💳 Payment Gateway',
          value: paymentMethod || 'Stripe Live Card',
          inline: true
        },
        {
          name: '🔑 Escrow Trade PIN',
          value: `\`PIN: ${pinCode || '8842'}\``,
          inline: true
        },
        {
          name: '💬 Buyer Discord',
          value: discordHandle ? `\`${discordHandle}\`` : '*Not provided*',
          inline: true
        },
        {
          name: `🎮 Game & Items (${gameName})`,
          value: itemsText.length > 1000 ? itemsText.substring(0, 990) + '...' : itemsText,
          inline: false
        },
        {
          name: '🚀 Staff Action Required',
          value: `[👉 **Click Here to Open & Claim Ticket in Staff Portal**](${ticketUrl})`,
          inline: false
        }
      ],
      footer: {
        text: 'GrandStock 24/7 Automated Escrow System • grandstock.net',
        icon_url: 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/zap.png'
      },
      timestamp: new Date().toISOString()
    }]
  });

  return new Promise((resolve) => {
    try {
      const url = new URL(webhookUrl);
      const req = https.request({
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      }, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`[Discord Notifier] Order notification #${orderId} sent to Discord (HTTP ${res.statusCode})`);
          resolve(true);
        } else {
          console.error(`[Discord Notifier] Discord returned error HTTP ${res.statusCode}`);
          resolve(false);
        }
      });

      req.on('error', (err) => {
        console.error('[Discord Notifier] Webhook request error:', err.message);
        resolve(false);
      });

      req.write(payload);
      req.end();
    } catch (e) {
      console.error('[Discord Notifier] Exception:', e.message);
      resolve(false);
    }
  });
}
