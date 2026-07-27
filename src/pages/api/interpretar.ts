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

function verificarPurezaMarsella(respuesta: string) {
  const terminosRider = [
    'viaje del héroe', 'viaje del heroe', 'inconsciente', 'sombra', 'golden dawn',
    'pentáculo', 'pentacle', 'varita mágica', 'cáliz sagrado',
    'alta sacerdotisa', 'emperatriz embarazada', 'acantilado'
  ];

  const contaminacion = terminosRider.filter((term) =>
    respuesta.toLowerCase().includes(term.toLowerCase())
  );

  return {
    esPuro: contaminacion.length === 0,
    terminosEncontrados: contaminacion,
  };
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

  // Necesitamos el plan del usuario ANTES de llamar a la IA para poder
  // ajustar la longitud de la interpretación (plan "caminante" = gratis).
  const profile = await getOrCreateUserProfile(user.uid, user);
  const esCaminante = profile.plan === 'free' || !profile.plan;

  const cartasList = cartas
    .map((c) => {
      const tipo = c.arcano === 'mayor' ? 'Arcano Mayor' : 'Arcano Menor';
      const id = c.numero ? ', n ' + c.numero : c.valor ? ', ' + c.valor : '';
      return c.nombre + ' (' + tipo + id + ')';
    })
    .join('; ');

  const limiteExtension = esCaminante
    ? `

8. LÍMITE DE EXTENSIÓN (PLAN CAMINANTE - GRATUITO):
   - Tu respuesta COMPLETA debe tener un MÁXIMO DE 150 PALABRAS en total, contando todos los apartados.
   - Resume cada apartado (Descripción visual, Significado numerológico, Interpretación según posición, Mensaje tradicional) en 1-2 frases muy concisas, directas y sin relleno.
   - Prioriza claridad y utilidad práctica sobre exhaustividad. No excedas el límite bajo ninguna circunstancia.`
    : '';

  const systemPrompt = `SISTEMA EXPERTO TAROT DE MARSELLA - PROTOCOLO ESTRICTO:
ERES UN EXPERTO EXCLUSIVO EN EL TAROT DE MARSELLA (Tarot de Marseille).

REGLAS OBLIGATORIAS PARA TUS INTERPRETACIONES:

1. NUNCA uses conceptos del Tarot de Rider-Waite-Smith como:
   - Imágenes escénicas con personajes en acción
   - Simbolismo de la Golden Dawn
   - Asociaciones astrológicas modernas
   - Interpretaciones psicológicas new age

2. DEBES basarte ÚNICAMENTE en la tradición pura de Marsella:
   - La geometría sagrada y patrones numéricos del Marsella
   - Los colores primarios medievales (rojo, azul, amarillo, blanco, negro)
   - La disposición espacial de los elementos en la carta
   - La dirección de las miradas de las figuras
   - El significado de los detalles: flores, hojas, columnas, suelo
   - La numerología medieval y pitagórica
   - Los palos tradicionales: Bastos, Copas, Espadas, Oros

3. DIFERENCIAS CLAVE A RESPETAR:
   - Marsella: NAIPES BIDIMENSIONALES MEDIEVALES → Rider: ESCENAS TRIDIMENSIONALES
   - Marsella: COLORES PLANOS SIMBÓLICOS → Rider: ILUSTRACIONES NARRATIVAS
   - Marsella: ICONOGRAFÍA CRISTIANA MEDIEVAL → Rider: OCULTISMO SIGLO XIX
   - Marsella: FIGURAS ESTÁTICAS SIMBÓLICAS → Rider: PERSONAJES EN ACCIÓN
   - Marsella: ORIGEN JUEGO DE NAIPES → Rider: ORIGEN ESOTÉRICO

4. VOCABULARIO PROHIBIDO (indica Rider-Waite):
   - "inconsciente colectivo", "sombra junguiana", "viaje del héroe", "viaje del heroe"
   - "elemento aire/tierra/fuego/agua" (en Marsella son palos: Bastos, Copas, Espadas, Oros)
   - Términos de la Golden Dawn o astrología moderna
   - "lección kármica", "leccion karmica", "vibración energética", "vibracion energetica"

5. VOCABULARIO MARSELLA CORRECTO:
   - "Arcano", "lámina", "naipe", "triunfo"
   - "Palo de Bastos/Copas/Espadas/Oros"
   - "Derecho/Invertido" (no bloqueado/sombra)
   - "Figura", "ornamento", "color"

6. REFERENCIAS AUTORIZADAS Y PRINCIPIOS:
   - Alejandro Jodorowsky: "La vía del Tarot", Philippe Camoin, Joseph Paul Marteau, Jean-Claude Flornoy, Marianne Costa.
   - La carta se lee como un TODO orgánico, no por símbolos aislados: El Tarot es un "ser" y un conjunto unitario donde cada detalle, por pequeño que sea, forma parte de un mandala o sistema coherente.
   - Los colores forman un lenguaje: El rojo representa la actividad, la vitalidad y el fuego; el azul (especialmente el oscuro) la recepción, la pasividad y la interiorización; y el amarillo la conciencia, la inteligencia y la luz del intelecto.
   - La dirección de las figuras indica movimiento energético: La mirada y los pies hacia la izquierda señalan el pasado y la receptividad, mientras que hacia la derecha indican el futuro y la acción.
   - Las manos muestran la acción del alma: Las manos pueden ser receptivas (si sostienen un continente) o activas (si sostienen un símbolo de poder como una vara o espada), revelando la disposición del personaje frente a su entorno.
   - Los pies indican la dirección del destino: La orientación de los pies determina el grado de actividad o receptividad y si el paso se dirige hacia lo material o lo espiritual.
   - El Tarot es un espejo: No sirve para predecir un futuro fatalista, sino que refleja la verdad subjetiva y el estado de conciencia presente del consultante.
   - La estructura es un doble cuadrado: La parte superior de la carta representa el Cielo (espiritualidad, mente), mientras que la inferior representa la Tierra (vida material, cuerpo).
   - Ley del 3+1: En cualquier grupo de cuatro elementos (como los cuatro Palos), tres son similares y uno es diferente, marcando este último el punto de transición o toma de conciencia.
   - La numerología es evolutiva: Los números del 1 al 10 representan un ciclo de crecimiento, desde la potencia inicial (As) hasta la transformación o fin de ciclo (10).
   - Ley de Repetición: Los símbolos se repiten de una carta a otra con sutiles diferencias (por ejemplo, el tamaño de las estrellas o la apertura de un velo), lo que indica un cambio de estado o evolución en la historia que cuentan.
   - El centro es la conciencia: En estructuras como el Arcano XXI (El Mundo), el personaje central representa la "quintaesencia" o el alma que armoniza las cuatro energías básicas del ser humano.
   - La lectura es una "frase" óptica: Las cartas puestas una al lado de la otra forman un lenguaje visual donde los personajes dialogan según sus miradas y gestos, creando un relato coherente.

7. FORMATO DE RESPUESTA OBLIGATORIO:
   Debes estructurar tu interpretación claramente con los siguientes apartados:
   - Descripción visual Marsella (no escénica)
   - Significado numerológico
   - Interpretación según posición espacial
   - Mensaje tradicional del arcano${limiteExtension}`;

  const userMessage = `CONSULTA DE TAROT DE MARSELLA:

Tirada de cartas: ${cartasList}
${pregunta ? `Pregunta / Tema de consulta: "${pregunta}"` : ''}

INSTRUCCIONES DE INTERPRETACIÓN:
1. Describe los elementos visuales ESPECÍFICOS del Tarot de Marsella para las cartas de la tirada.
2. Explica el simbolismo NUMÉRICO y GEOMÉTRICO conjunto y de cada arcano.
3. Interpreta según la TRADICIÓN MARSELLESA (Jodorowsky, Camoin, Marteau, etc.).
4. Menciona el significado de los COLORES y su disposición espacial en la tirada (miradas, gestos, direcciones).
5. Si hay cartas invertivas/al revés, explica la interpretación marsellesa (no psicológica).
6. Explica cómo dialogan las cartas entre sí (frase óptica).

RECUERDA: NO uses referencias del Rider-Waite. Si no conoces la tradición marsellesa para alguna carta, indícalo honestamente.${esCaminante
      ? '\nRECUERDA TAMBIÉN: Esta es una consulta del plan CAMINANTE (gratuito). Tu respuesta debe ser MUY BREVE, con un máximo absoluto de 150 palabras en total.'
      : ''
    }`;

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
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: esCaminante ? 320 : 1000,
        temperature: 0.4,
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
  const pureza = verificarPurezaMarsella(interpretacion);

  const saveAllowed = canSaveReading(profile.plan, profile.readingCount);

  let warning: string | null = null;
  const metadatos = {
    tradicion: 'Tarot de Marsella',
    verificacionPureza: pureza,
  };

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
      metadatos,
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

  return json({ interpretacion, warning, metadatos });
}