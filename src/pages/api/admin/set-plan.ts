export const prerender = false;

import type { APIContext } from 'astro';
import { verifySessionCookieFromRequest } from '../../../lib/auth-server';
import { adminDb } from '../../../lib/firebase-admin';

export async function GET(context: APIContext): Promise<Response> {
  const user = await verifySessionCookieFromRequest(context);
  if (!user) {
    return new Response('No autenticado. Por favor inicia sesión primero.', {
      status: 401,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  const url = new URL(context.request.url);
  let plan = url.searchParams.get('plan') || 'buscador_monthly';
  if (plan === 'buscador') {
    plan = 'buscador_monthly';
  } else if (plan === 'guia') {
    plan = 'guia_monthly';
  } else if (plan === 'caminante' || plan === 'free') {
    plan = 'free';
  }
  const status = url.searchParams.get('status') || 'active';

  await adminDb.collection('users').doc(user.uid).set(
    {
      plan,
      planStatus: status,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  return new Response(`
    <html>
      <head>
        <title>Plan Actualizado</title>
        <style>
          body { font-family: system-ui, sans-serif; text-align: center; padding: 3rem; background: #faf8f5; color: #333; }
          .card { max-width: 500px; margin: 0 auto; background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #eae6e0; }
          h1 { color: #8c7853; margin-top: 0; }
          a { display: inline-block; margin-top: 1.5rem; padding: 0.5rem 1.5rem; background: #8c7853; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
          a:hover { background: #766341; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>¡Plan Actualizado!</h1>
          <p>El plan para tu usuario <strong>${user.email || user.uid}</strong> ha sido cambiado a: <strong>${plan}</strong> (${status}).</p>
          <p>Ya puedes volver al perfil o a la tirada para ver y probar las características de este plan.</p>
          <a href="/profile">Ir al perfil</a>
        </div>
      </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}
