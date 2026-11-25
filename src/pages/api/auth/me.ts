import type { APIRoute } from 'astro';
import { verifySessionCookieFromRequest, getOrCreateUserProfile } from '../../../lib/auth-server';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const user = await verifySessionCookieFromRequest(context);
  if (!user) {
    return new Response(JSON.stringify({ authenticated: false }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const profile = await getOrCreateUserProfile(user.uid, {
    email: user.email,
    name: user.name,
  });

  return new Response(
    JSON.stringify({
      authenticated: true,
      user: {
        uid: user.uid,
        email: user.email,
        name: user.name,
      },
      profile,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};
