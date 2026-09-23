export async function onRequestGet(context) {
  const { env } = context;
  const publishableKey = env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_TYooMQauvdEDq54NiTphI7jx';
  const secretKey = env.STRIPE_SECRET_KEY || '';

  return new Response(JSON.stringify({
    publishableKey,
    hasSecretKey: Boolean(secretKey && secretKey.startsWith('sk_')),
    mode: secretKey.startsWith('sk_live_') ? 'LIVE' : secretKey.startsWith('sk_test_') ? 'TEST' : 'NEEDS_KEYS'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
