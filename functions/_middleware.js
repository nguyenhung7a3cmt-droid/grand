// Cloudflare Edge Security & Anti-DDoS Middleware
export async function onRequest(context) {
  const { request, next } = context;

  // Execute request
  const response = await next();

  // Clone and add global security & anti-tamper headers
  const newHeaders = new Headers(response.headers);
  newHeaders.set('X-Frame-Options', 'DENY');
  newHeaders.set('X-Content-Type-Options', 'nosniff');
  newHeaders.set('X-XSS-Protection', '1; mode=block');
  newHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  newHeaders.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  newHeaders.set('X-Shield', 'GrandStock-Edge-Defense');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}
