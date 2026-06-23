export const prerender = false;

import type { APIContext } from 'astro';
import { verifySessionCookieFromRequest, getOrCreateUserProfile } from '../../lib/auth-server';
import { adminDb } from '../../lib/firebase-admin';
import { canSaveReading, FREE_READING_LIMIT } from '../../lib/plans';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

interface CartaInput {
  nombre: string;
  arcano: string;
  numero?: number;
  valor?: string;
}

export async function POST(context: APIContext): Promise<Response> {
  const { request } = context;
  const user = await verifySessionCookieFromRequest(context);
  if (!user) {
    return json({ error: 'Debes iniciar sesión para interpretar y guardar tiradas.' }, 401);
  }

  let cartas: CartaInput[] = [];
  let pregunta = '';

  try {
    const body = (await request.json()) as { cartas?: CartaInput[]; pregunta?: string };
    cartas = body.cartas ?? [];
    pregunta = (body.pregunta || '').trim();
  } catch {
    return json({ error: 'Cuerpo de la peticion invalido' }, 400);
  }

  if (cartas.length === 0) {
    return json({ error: 'No hay cartas para interpretar' }, 400);
  }

  const apiKey = String(import.meta.env.OPENAI_API_KEY ?? '').replace(/\s/g, '');
  if (!apiKey || apiKey.startsWith('sk-xxx') || apiKey.length < 20) {
    return json(
      { error: 'Configura OPENAI_API_KEY en el archivo .env para usar esta funcion.' },
      503
    );
  }

  const cartasList = cartas
    .map((c) => {
      const tipo = c.arcano === 'mayor' ? 'Arcano Mayor' : 'Arcano Menor';
      const id = c.numero ? ', n ' + c.numero : c.valor ? ', ' + c.valor : '';
      return c.nombre + ' (' + tipo + id + ')';
    })
    .join('; ');

  let prompt =
    'Eres un experto en Tarot de Marsella con decadas de experiencia. ' +
    'Realiza una interpretacion en espanol de esta tirada de cartas: ' + cartasList + '. ';

  if (pregunta) {
    prompt += 'La tirada se ha intencionado con la siguiente pregunta o tema del consultante: "' + pregunta + '". Adapta e integra esta consulta en tu interpretacion de forma natural. ';
  }

  prompt +=
    'Responde con 4 a 6 oraciones que expliquen el mensaje conjunto de las cartas, ' +
    'como se relacionan entre si y que nos revelan. ' +
    'Mantente reflexivo, simbolico y constructivo.';

  let aiResponse: Response;
  try {
    aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 450,
        temperature: 0.75,
      }),
    });
  } catch (e) {
    console.error('[interpretar] fetch error:', e);
    return json({ error: 'Error al conectar con el servicio de IA' }, 502);
  }

  if (!aiResponse.ok) {
    const errTxt = await aiResponse.text().catch(() => '');
    console.error('[interpretar] OpenAI error:', aiResponse.status, errTxt);

    let mensaje = 'Error al generar la interpretacion. Intentalo de nuevo.';
    if (aiResponse.status === 429) {
      mensaje = 'La cuenta de OpenAI no tiene credito disponible. Añade saldo en platform.openai.com/billing para usar esta funcion.';
    } else if (aiResponse.status === 401) {
      mensaje = 'La clave de OpenAI no es valida. Revisa OPENAI_API_KEY en el archivo .env.';
    }
    return json({ error: mensaje }, 502);
  }

  const data = (await aiResponse.json()) as { choices: Array<{ message: { content: string } }> };
  const interpretacion = (data.choices[0]?.message?.content ?? '').trim();

  const profile = await getOrCreateUserProfile(user.uid, user);
  const saveAllowed = canSaveReading(profile.plan, profile.readingCount);

  let warning: string | null = null;
  if (saveAllowed) {
    const now = new Date().toISOString();
    const readingRef = adminDb.collection('users').doc(user.uid).collection('readings').doc();

    await readingRef.set({
      uid: user.uid,
      cards: cartas,
      interpretation: interpretacion,
      pregunta: pregunta || null,
      source: 'random-cards',
      createdAt: now,
      updatedAt: now,
    });

    await adminDb.collection('users').doc(user.uid).set(
      {
        readingCount: (profile.readingCount ?? 0) + 1,
        updatedAt: now,
      },
      { merge: true }
    );
  } else {
    warning = `Has alcanzado el limite de ${FREE_READING_LIMIT} tiradas del plan gratuito. Actualiza a premium para guardado ilimitado.`;
  }

  return json({ interpretacion, warning });
}
