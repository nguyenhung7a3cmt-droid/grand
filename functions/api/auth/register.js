function base64UrlEncode(str) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function signToken(payload, secret) {
  const enc = new TextEncoder();
  const tokenData = base64UrlEncode(JSON.stringify(payload));
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(tokenData));
  const signature = btoa(String.fromCharCode(...new Uint8Array(sigBuffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `${tokenData}.${signature}`;
}

export async function onRequestPost(context) {
  try {
    const { request } = context;
    const { name, email, password, robloxUsername } = await request.json();

    if (!name || !email || !password) {
      return new Response(JSON.stringify({ error: 'Name, email, and password are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const newUser = {
      id: `usr-cust-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: 'customer', // STRICT: Public registration can NEVER create staff or admin
      isOwner: false,
      robloxUsername: (robloxUsername || name).trim(),
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(robloxUsername || name)}&backgroundColor=111218`,
      tradesCompleted: 0,
      createdAt: new Date().toISOString(),
      assignedGames: []
    };

    const secret = context.env?.JWT_SECRET || (typeof process !== 'undefined' && process.env?.JWT_SECRET) || 'grandstock_production_jwt_key_2026_secure';
    const token = await signToken({
      id: newUser.id,
      email: newUser.email,
      role: 'customer',
      isOwner: false,
      exp: Date.now() + 86400000 * 7
    }, secret);

    return new Response(JSON.stringify({ success: true, user: newUser, token }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
