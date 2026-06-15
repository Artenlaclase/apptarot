import type { APIRoute } from 'astro';
import { clearSessionCookie } from '../../../lib/auth-server';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  clearSessionCookie(context);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
