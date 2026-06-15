import { defineMiddleware } from 'astro:middleware';
import { verifySessionCookieFromRequest } from './lib/auth-server';

const protectedPrefixes = ['/account', '/premium', '/profile'];

function isProtected(pathname: string): boolean {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export const onRequest = defineMiddleware(async (context, next) => {
  const user = await verifySessionCookieFromRequest(context);
  context.locals.user = user;

  if (isProtected(context.url.pathname) && !user) {
    const nextPath = encodeURIComponent(context.url.pathname + context.url.search);
    return context.redirect(`/auth/login?next=${nextPath}`);
  }

  return next();
});
