import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (stripeClient) return stripeClient;

  const apiKey = import.meta.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error('Missing STRIPE_SECRET_KEY env var');
  }

  stripeClient = new Stripe(apiKey, {
    apiVersion: '2025-05-28.basil',
  });

  return stripeClient;
}

export function getStripePrices() {
  return {
    monthly: import.meta.env.STRIPE_PRICE_MONTHLY,
    annual: import.meta.env.STRIPE_PRICE_ANNUAL,
  };
}
