import type { APIRoute } from 'astro';
import { verifySessionCookieFromRequest } from '../../../lib/auth-server';
import { adminDb } from '../../../lib/firebase-admin';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const user = await verifySessionCookieFromRequest(context);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const body = (await context.request.json().catch(() => ({}))) as { readingId?: string };
  const readingId = body.readingId;

  if (!readingId) {
    return new Response(JSON.stringify({ error: 'readingId requerido' }), { status: 400 });
  }

  await adminDb.collection('users').doc(user.uid).collection('readings').doc(readingId).delete();

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
