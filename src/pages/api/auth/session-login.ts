import type { APIRoute } from 'astro';
import { adminAuth } from '../../../lib/firebase-admin';
import { createSessionCookie, getOrCreateUserProfile, setSessionCookie } from '../../../lib/auth-server';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const body = (await context.request.json()) as { idToken?: string };
    const idToken = body.idToken;

    if (!idToken) {
      return new Response(JSON.stringify({ error: 'idToken requerido' }), { status: 400 });
    }

    const decoded = await adminAuth.verifyIdToken(idToken, true);
    const sessionCookie = await createSessionCookie(idToken);

    await getOrCreateUserProfile(decoded.uid, {
      email: decoded.email,
      name: decoded.name,
    });

    setSessionCookie(context, sessionCookie);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[session-login] error:', error);
    return new Response(JSON.stringify({ error: 'No se pudo iniciar sesion' }), { status: 401 });
  }
};
