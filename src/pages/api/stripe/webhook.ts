import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { getStripe } from '../../../lib/stripe';
import { adminDb } from '../../../lib/firebase-admin';

export const prerender = false;

function mapPlan(priceId?: string): 'free' | 'premium_monthly' | 'premium_annual' {
  if (!priceId) return 'free';
  if (priceId === import.meta.env.STRIPE_PRICE_ANNUAL) return 'premium_annual';
  if (priceId === import.meta.env.STRIPE_PRICE_MONTHLY) return 'premium_monthly';
  return 'free';
}

async function getUidFromCustomer(customerId: string): Promise<string | null> {
  const usersByCustomer = await adminDb
    .collection('users')
    .where('stripeCustomerId', '==', customerId)
    .limit(1)
    .get();

  if (!usersByCustomer.empty) {
    return usersByCustomer.docs[0].id;
  }

  const stripe = getStripe();
  const customer = await stripe.customers.retrieve(customerId);

  if (!customer || customer.deleted) return null;
  const uid = customer.metadata?.uid;
  return uid || null;
}

async function updateUserSubscription(subscription: Stripe.Subscription): Promise<void> {
  const customerId = String(subscription.customer);
  const uid = await getUidFromCustomer(customerId);
  if (!uid) return;

  const priceId = subscription.items.data[0]?.price?.id;
  const plan = mapPlan(priceId);
  const status = subscription.status === 'active' ? 'active' : subscription.status;

  await adminDb.collection('users').doc(uid).set(
    {
      plan,
      planStatus: status,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      subscriptionCurrentPeriodEnd: subscription.items.data[0]?.current_period_end
        ? new Date(subscription.items.data[0].current_period_end * 1000).toISOString()
        : null,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

export const POST: APIRoute = async ({ request }) => {
  const stripe = getStripe();
  const signature = request.headers.get('stripe-signature');
  const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return new Response('Missing webhook configuration', { status: 400 });
  }

  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('[stripe-webhook] signature verification failed', err);
    return new Response('Invalid signature', { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const uid = session.metadata?.uid || session.client_reference_id;
      const subscriptionId = session.subscription ? String(session.subscription) : '';
      const customerId = session.customer ? String(session.customer) : '';

      if (uid && customerId) {
        await adminDb.collection('users').doc(uid).set(
          {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await updateUserSubscription(subscription);
      }
    }

    if (
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      await updateUserSubscription(subscription);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error('[stripe-webhook] handler failed', error);
    return new Response('Webhook handler failed', { status: 500 });
  }
};
