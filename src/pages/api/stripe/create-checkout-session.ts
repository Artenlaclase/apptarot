import type { APIRoute } from 'astro';
import { verifySessionCookieFromRequest, getOrCreateUserProfile } from '../../../lib/auth-server';
import { adminDb } from '../../../lib/firebase-admin';
import { getStripe, getStripePrices } from '../../../lib/stripe';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const user = await verifySessionCookieFromRequest(context);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const body = (await context.request.json().catch(() => ({}))) as { billingCycle?: 'monthly' | 'annual' };
  const billingCycle = body.billingCycle === 'annual' ? 'annual' : 'monthly';

  const prices = getStripePrices();
  const priceId = billingCycle === 'annual' ? prices.annual : prices.monthly;

  if (!priceId) {
    return new Response(JSON.stringify({ error: 'Price not configured' }), { status: 500 });
  }

  const stripe = getStripe();
  const profile = await getOrCreateUserProfile(user.uid, user);

  let customerId = profile.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { uid: user.uid },
    });
    customerId = customer.id;

    await adminDb.collection('users').doc(user.uid).set(
      {
        stripeCustomerId: customerId,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  }

  const appUrl = import.meta.env.PUBLIC_APP_URL || context.url.origin;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/profile?checkout=success`,
    cancel_url: `${appUrl}/profile?checkout=cancel`,
    client_reference_id: user.uid,
    metadata: {
      uid: user.uid,
      billingCycle,
    },
    allow_promotion_codes: true,
  });

  return new Response(JSON.stringify({ url: session.url }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
