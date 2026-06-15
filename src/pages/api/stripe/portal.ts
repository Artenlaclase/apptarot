import type { APIRoute } from 'astro';
import { getStripe } from '../../../lib/stripe';
import { verifySessionCookieFromRequest, getOrCreateUserProfile } from '../../../lib/auth-server';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const user = await verifySessionCookieFromRequest(context);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const profile = await getOrCreateUserProfile(user.uid, user);
  if (!profile.stripeCustomerId) {
    return new Response(JSON.stringify({ error: 'No active billing account found' }), { status: 400 });
  }

  const stripe = getStripe();
  const appUrl = import.meta.env.PUBLIC_APP_URL || context.url.origin;

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripeCustomerId,
    return_url: `${appUrl}/profile`,
  });

  return new Response(JSON.stringify({ url: session.url }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
