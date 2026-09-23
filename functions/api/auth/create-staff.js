async function verifyToken(token, secret) {
  if (!token || !token.includes('.')) return null;
  const [tokenData, signature] = token.split('.');
  if (!tokenData || !signature) return null;
  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const binString = atob(signature.replace(/-/g, '+').replace(/_/g, '/'));
    const sigBytes = new Uint8Array(binString.length);
    for (let i = 0; i < binString.length; i++) {
      sigBytes[i] = binString.charCodeAt(i);
    }
    const isValid = await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(tokenData));
    if (!isValid) return null;

    const payloadJson = atob(tokenData.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson);
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function onRequestPost(context) {
  try {
    const { request } = context;
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');

    const secret = context.env?.JWT_SECRET || (typeof process !== 'undefined' && process.env?.JWT_SECRET) || 'grandstock_production_jwt_key_2026_secure';
    const payload = await verifyToken(token, secret);

    if (!payload || (payload.role !== 'admin' && !payload.isOwner)) {
      return new Response(JSON.stringify({ error: 'Access denied. Only the Site Owner can create staff.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { name, email, password, robloxUsername, assignedGames } = await request.json();

    if (!name || !email || !password || !robloxUsername) {
      return new Response(JSON.stringify({ error: 'Staff name, email, password, and Roblox handle required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const newStaff = {
      id: `usr-staff-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: 'staff',
      isOwner: false,
      robloxUsername: robloxUsername.trim(),
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      tradesCompleted: 0,
      rating: '5.0★',
      createdAt: new Date().toISOString(),
      assignedGames: assignedGames || ['All Games']
    };

    return new Response(JSON.stringify({ success: true, staff: newStaff }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
