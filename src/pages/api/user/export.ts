import type { APIRoute } from 'astro';
import { verifySessionCookieFromRequest, getOrCreateUserProfile } from '../../../lib/auth-server';
import { adminDb } from '../../../lib/firebase-admin';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const user = await verifySessionCookieFromRequest(context);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const profile = await getOrCreateUserProfile(user.uid, user);
  const readingsSnapshot = await adminDb
    .collection('users')
    .doc(user.uid)
    .collection('readings')
    .orderBy('createdAt', 'desc')
    .get();

  const readings = readingsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  const payload = {
    exportedAt: new Date().toISOString(),
    user: {
      uid: user.uid,
      email: user.email,
      name: user.name,
    },
    profile,
    readings,
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="apptarot-data-${user.uid}.json"`,
    },
  });
};
