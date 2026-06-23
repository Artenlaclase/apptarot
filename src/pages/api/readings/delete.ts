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

  const userRef = adminDb.collection('users').doc(user.uid);
  const readingRef = userRef.collection('readings').doc(readingId);

  try {
    await adminDb.runTransaction(async (transaction) => {
      const readingSnap = await transaction.get(readingRef);
      if (!readingSnap.exists) {
        throw new Error('La lectura no existe o ya fue eliminada.');
      }

      const userSnap = await transaction.get(userRef);
      const currentCount = userSnap.data()?.readingCount || 0;
      const newCount = Math.max(0, currentCount - 1);

      transaction.delete(readingRef);
      transaction.update(userRef, {
        readingCount: newCount,
        updatedAt: new Date().toISOString(),
      });
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error al eliminar la lectura.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
