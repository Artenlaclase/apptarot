import type { APIRoute } from 'astro';
import { adminDb } from '../../../lib/firebase-admin';
import { verifySessionCookieFromRequest } from '../../../lib/auth-server';
import {
  calculatePersonalArcane,
  getDailyArcaneHint,
  normalizeBirthDateInput,
  validateBirthDate,
  validateBirthHour,
  validateFullName,
} from '../../../lib/arcaneCalculator';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const user = await verifySessionCookieFromRequest(context);
  if (!user) {
    return new Response(JSON.stringify({ error: 'No autorizado.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = (await context.request.json()) as {
      firstName?: string;
      lastName?: string;
      birthDate?: string;
      birthHour?: string;
      bio?: string;
      hobbies?: string;
      socialInstagram?: string;
      socialFacebook?: string;
      socialTiktok?: string;
      socialWebsite?: string;
    };

    const firstName = (body.firstName || '').trim();
    const lastName = (body.lastName || '').trim();
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
    const birthDate = normalizeBirthDateInput(body.birthDate || '');
    const birthHour = (body.birthHour || '').trim();
    const bio = (body.bio || '').trim();
    const hobbies = (body.hobbies || '').trim();
    const socialInstagram = (body.socialInstagram || '').trim();
    const socialFacebook = (body.socialFacebook || '').trim();
    const socialTiktok = (body.socialTiktok || '').trim();
    const socialWebsite = (body.socialWebsite || '').trim();

    const fullNameValidation = validateFullName(fullName);
    if (!fullNameValidation.valid) {
      return new Response(JSON.stringify({ error: fullNameValidation.message || 'Nombre inválido.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const updates: Record<string, unknown> = {
      fullName,
      displayName: fullName,
      bio: bio || null,
      hobbies: hobbies || null,
      socialInstagram: socialInstagram || null,
      socialFacebook: socialFacebook || null,
      socialTiktok: socialTiktok || null,
      socialWebsite: socialWebsite || null,
      updatedAt: new Date().toISOString(),
    };

    if (birthDate) {
      const birthDateValidation = validateBirthDate(birthDate);
      if (!birthDateValidation.valid) {
        return new Response(JSON.stringify({ error: birthDateValidation.message || 'Fecha inválida.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const birthHourValidation = validateBirthHour(birthHour);
      if (!birthHourValidation.valid) {
        return new Response(JSON.stringify({ error: birthHourValidation.message || 'Hora inválida.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const arcane = calculatePersonalArcane(birthDate);
      updates.birthDate = birthDate;
      updates.birthHour = birthHour || null;
      updates.personalArcaneNumber = arcane.number;
      updates.personalArcaneName = arcane.name;
      updates.personalArcaneMeaning = getDailyArcaneHint(arcane.number);
      updates.personalArcaneCalculatedAt = new Date().toISOString();
    }

    // Filtrar valores undefined antes de guardar
    const safeUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );

    await adminDb.collection('users').doc(user.uid).set(safeUpdates, { merge: true });

    return new Response(JSON.stringify({ ok: true, profile: safeUpdates }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'No se pudo actualizar el perfil.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};