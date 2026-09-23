import Stripe from 'stripe';

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { amount, currency = 'usd', robloxUsername, items } = body;

    // SECURITY WARNING: Currently takes `amount` directly from client.
    // In production, this needs server-side catalog price verification: recalculate the total
    // by fetching items and quantities against canonical server-side database/catalog prices.
    const parsedAmount = Number(amount);
    if (typeof amount === 'undefined' || amount === null || isNaN(parsedAmount) || !isFinite(parsedAmount) || parsedAmount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid order amount: must be a positive number' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Minimum amount floor check: Stripe requires minimum $0.50 USD transaction floor
    if (parsedAmount < 0.50) {
      return new Response(JSON.stringify({ error: 'Order amount below minimum floor ($0.50 Stripe minimum required)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const secretKey = env.STRIPE_SECRET_KEY;
    const publishableKey = env.VITE_STRIPE_PUBLISHABLE_KEY || '';

    if (!secretKey || !secretKey.startsWith('sk_')) {
      return new Response(JSON.stringify({
        clientSecret: `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substring(2, 9)}`,
        paymentIntentId: `pi_mock_${Date.now()}`,
        amount: Math.round(parsedAmount * 100),
        currency: currency.toLowerCase(),
        publishableKey,
        isMock: true,
        message: 'Please configure STRIPE_SECRET_KEY in Cloudflare Pages Environment Variables'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient()
    });

    // SECURITY NOTE: Needs server-side catalog price verification rather than trusting parsedAmount
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(parsedAmount * 100),
      currency: currency.toLowerCase(),
      payment_method_types: ['card'],
      metadata: {
        robloxUsername: robloxUsername || 'Customer',
        itemCount: Array.isArray(items) ? items.length : 1,
        platform: 'grandstock.net'
      }
    });

    return new Response(JSON.stringify({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      publishableKey,
      isLive: secretKey.startsWith('sk_live_')
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
