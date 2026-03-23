export const prerender = false;

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

export async function POST({ request }: { request: Request }): Promise<Response> {
  let cartas: CartaInput[] = [];

  try {
    const body = (await request.json()) as { cartas?: CartaInput[] };
    cartas = body.cartas ?? [];
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

  const prompt =
    'Eres un experto en Tarot de Marsella con decadas de experiencia. ' +
    'Realiza una interpretacion en espanol de esta tirada de cartas: ' + cartasList + '. ' +
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

  return json({ interpretacion });
}
