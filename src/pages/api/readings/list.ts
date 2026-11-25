import type { APIRoute } from 'astro';
import { adminDb } from '../../../lib/firebase-admin';
import { verifySessionCookieFromRequest } from '../../../lib/auth-server';

function toISO(value: any): string {
  if (!value) return new Date().toISOString();
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  try {
    const d = new Date(value);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

export const GET: APIRoute = async (context) => {
  const user = await verifySessionCookieFromRequest(context);
  if (!user) {
    return new Response(JSON.stringify({ error: 'No autorizado.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const limitParam = context.url.searchParams.get('limit') || '10';
    const limit = Math.min(Math.max(1, parseInt(limitParam, 10)), 100);

    const snapshot = await adminDb
      .collection('users')
      .doc(user.uid)
      .collection('readings')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const readings = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: toISO(doc.data().createdAt),
    }));

    return new Response(JSON.stringify({ readings }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error al obtener lecturas.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
