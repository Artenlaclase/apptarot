import type { APIRoute } from 'astro';
import { adminAuth } from '../../../lib/firebase-admin';
import { createSessionCookie, getOrCreateUserProfile, setSessionCookie } from '../../../lib/auth-server';

export const prerender = false;

function getSessionLoginErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? '');

  if (message.includes('invalid_grant') || message.includes('account not found')) {
    return 'Configuracion de Firebase Admin invalida o revocada. Genera una nueva clave de Service Account y actualiza FIREBASE_ADMIN_CLIENT_EMAIL/FIREBASE_ADMIN_PRIVATE_KEY.';
  }

  if (message.includes('DECODER routines') || message.includes('Failed to parse private key')) {
    return 'La variable FIREBASE_ADMIN_PRIVATE_KEY no tiene formato valido. Debe incluir BEGIN/END PRIVATE KEY y saltos como \\n.';
  }

  if (message.includes('Auth unavailable')) {
    return 'Firebase Admin no esta disponible en el servidor. Revisa variables FIREBASE_ADMIN_*.';
  }

  return 'No se pudo iniciar sesión en servidor. Revisa la configuracion de Firebase Admin.';
}

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
    return new Response(JSON.stringify({ error: getSessionLoginErrorMessage(error) }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
