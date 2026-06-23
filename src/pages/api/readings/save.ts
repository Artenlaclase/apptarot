import type { APIRoute } from 'astro';
import { adminDb } from '../../../lib/firebase-admin';
import { verifySessionCookieFromRequest } from '../../../lib/auth-server';

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
      cards?: string[];
      mode?: string;
      interpretation?: string;
      date?: string;
      pregunta?: string;
    };

    const cards = Array.isArray(body.cards) ? body.cards : [];
    const mode = (body.mode || 'mixta').trim();
    const interpretation = (body.interpretation || '').trim();
    const date = body.date || new Date().toISOString();
    const pregunta = (body.pregunta || '').trim();

    if (!interpretation) {
      return new Response(JSON.stringify({ error: 'La interpretación es obligatoria.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (cards.length === 0) {
      return new Response(JSON.stringify({ error: 'Se requiere al menos una carta.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Guardar lectura en subcollection
    const readingId = adminDb.collection('users').doc(user.uid).collection('readings').doc().id;
    await adminDb
      .collection('users')
      .doc(user.uid)
      .collection('readings')
      .doc(readingId)
      .set({
        id: readingId,
        cards,
        mode,
        interpretation,
        pregunta: pregunta || null,
        createdAt: new Date(date),
        updatedAt: new Date().toISOString(),
      });

    // Actualizar contador de lecturas en el perfil
    const userRef = adminDb.collection('users').doc(user.uid);
    await userRef.update({
      readingCount: ((await userRef.get()).data()?.readingCount || 0) + 1,
    });

    return new Response(JSON.stringify({ ok: true, readingId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error al guardar la lectura.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
