import type { APIContext, AstroGlobal } from 'astro';
import { Timestamp } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from './firebase-admin';
import type { UserProfile, UserPlan } from '../types/auth';

const SESSION_COOKIE_NAME = 'apptarot_session';
const SESSION_EXPIRES_MS = 1000 * 60 * 60 * 24 * 7;

function toISO(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === 'string') return value;
  return new Date().toISOString();
}

export async function createSessionCookie(idToken: string): Promise<string> {
  return adminAuth.createSessionCookie(idToken, { expiresIn: SESSION_EXPIRES_MS });
}

export function setSessionCookie(context: APIContext, cookieValue: string): void {
  context.cookies.set(SESSION_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_EXPIRES_MS / 1000,
  });
}

export function clearSessionCookie(context: APIContext): void {
  context.cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
}

export async function verifySessionCookieFromRequest(context: APIContext | AstroGlobal): Promise<{ uid: string; email?: string; name?: string } | null> {
  const sessionCookie = context.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    return {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
    };
  } catch {
    return null;
  }
}

export async function getOrCreateUserProfile(uid: string, fallback: { email?: string; name?: string } = {}): Promise<UserProfile> {
  const profileRef = adminDb.collection('users').doc(uid);
  const snapshot = await profileRef.get();

  if (!snapshot.exists) {
    const now = new Date().toISOString();
    const profile: UserProfile = {
      uid,
      email: fallback.email ?? '',
      displayName: fallback.name,
      fullName: fallback.name,
      plan: 'free',
      planStatus: 'inactive',
      readingCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    // Strip undefined values — Firestore Admin does not accept them
    const safeProfile = Object.fromEntries(
      Object.entries(profile).filter(([, v]) => v !== undefined)
    ) as UserProfile;
    await profileRef.set(safeProfile, { merge: true });
    return profile;
  }

  const data = snapshot.data() as Partial<UserProfile>;
  return {
    uid,
    email: data.email ?? fallback.email ?? '',
    displayName: data.displayName ?? fallback.name,
    fullName: data.fullName ?? data.displayName ?? fallback.name,
    bio: data.bio,
    hobbies: data.hobbies,
    socialInstagram: data.socialInstagram,
    socialFacebook: data.socialFacebook,
    socialTiktok: data.socialTiktok,
    socialWebsite: data.socialWebsite,
    photoURL: data.photoURL,
    birthDate: data.birthDate,
    birthHour: data.birthHour,
    personalArcaneNumber: data.personalArcaneNumber,
    personalArcaneName: data.personalArcaneName,
    personalArcaneMeaning: data.personalArcaneMeaning,
    personalArcaneCalculatedAt: data.personalArcaneCalculatedAt ? toISO(data.personalArcaneCalculatedAt) : undefined,
    plan: (data.plan ?? 'free') as UserPlan,
    planStatus: data.planStatus ?? 'inactive',
    stripeCustomerId: data.stripeCustomerId,
    stripeSubscriptionId: data.stripeSubscriptionId,
    subscriptionCurrentPeriodEnd: data.subscriptionCurrentPeriodEnd,
    readingCount: data.readingCount ?? 0,
    createdAt: toISO(data.createdAt),
    updatedAt: toISO(data.updatedAt),
  };
}

export { SESSION_COOKIE_NAME };
