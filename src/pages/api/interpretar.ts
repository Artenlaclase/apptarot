export const prerender = false;

import type { APIContext } from 'astro';
import { verifySessionCookieFromRequest, getOrCreateUserProfile } from '../../lib/auth-server';
import { adminDb } from '../../lib/firebase-admin';
import { canSaveReading, FREE_READING_LIMIT, getReadingLimit } from '../../lib/plans';

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
  imagem?: string;
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
    if (!pregunta) {
      pregunta = '¿Cuál es la energía actual del consultante?';
    }
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

3. ADVERTENCIA CRÍTICA SOBRE PALOS MENORES:
   - Las cartas del 1 al 10 de los palos menores (Bastos, Copas, Espadas, Oros) NO tienen personajes ni figuras humanas (no hay caballos, jinetes, ni personas en acción). Son naipes estrictamente abstractos que constan de los símbolos del palo dispuestos geométricamente y acompañados por detalles ornamentales de flores, hojas, columnas y líneas. Solo las Figuras de la corte (Sota/Valet, Caballo/Cavalier, Reina, Rey) y los Arcanos Mayores contienen personajes.

4. DIFERENCIAS CLAVE A RESPETAR:
   - Marsella: NAIPES BIDIMENSIONALES MEDIEVALES → Rider: ESCENAS TRIDIMENSIONALES
   - Marsella: COLORES PLANOS SIMBÓLICOS → Rider: ILUSTRACIONES NARRATIVAS
   - Marsella: ICONOGRAFÍA CRISTIANA MEDIEVAL → Rider: OCULTISMO SIGLO XIX
   - Marsella: FIGURAS ESTÁTICAS SIMBÓLICAS → Rider: PERSONAJES EN ACCIÓN
   - Marsella: ORIGEN JUEGO DE NAIPES → Rider: ORIGEN ESOTÉRICO

5. VOCABULARIO PROHIBIDO (indica Rider-Waite):
   - "elemento aire/tierra/fuego/agua" (en Marsella son palos: Bastos, Copas, Espadas, Oros)
   - Términos de la Golden Dawn o astrología moderna
   

6. VOCABULARIO MARSELLA CORRECTO:
   - "Arcano", "lámina", "naipe", "triunfo"
   - "Palo de Bastos/Copas/Espadas/Oros"
   - "Derecho/Invertido" (no bloqueado/sombra)
   - "Figura", "ornamento", "color"

7. REFERENCIAS AUTORIZADAS Y PRINCIPIOS:
   - Alejandro Jodorowsky: "La vía del Tarot", Philippe Camoin, Joseph Paul Marteau, Jean-Claude Flornoy, Marianne Costa.
   - La carta se lee como un TODO orgánico, no por símbolos aislados: El Tarot es un "ser" y un conjunto unitario coherente.
   - Los colores forman un lenguaje: El rojo representa la actividad, la vitalidad y el fuego; el azul (especialmente el oscuro) la recepción, la pasividad y la interiorización; y el amarillo la conciencia, la inteligencia y la luz del intelecto.
   - La dirección de las figuras indica movimiento energético: La mirada y los pies hacia la izquierda señalan el pasado y la receptividad, mientras que hacia la derecha indican el futuro y la acción.
   - Las manos muestran la acción del alma: Las manos pueden ser receptivas o activas, revelando la disposición del personaje frente a su entorno.
   - Los pies indican la dirección del destino: La orientación de los pies determina el grado de actividad o receptividad y si el paso se dirige hacia lo material o lo espiritual.
   - El Tarot es un espejo del estado de conciencia presente del consultante.
   - La estructura es un doble cuadrado: la parte superior representa el Cielo y la inferior representa la Tierra.
   - Ley del 3+1, Ley de Repetición y la numerología evolutiva (1 al 10).
   - La lectura es una "frase" óptica: las cartas puestas al lado forman un diálogo según miradas y gestos.

8. FORMATO DE RESPUESTA OBLIGATORIO:
   Debes responder con una única interpretación fluida y unificada (mensaje tradicional de la tirada) que integre la descripción visual de Marsella, el significado numérico/geométrico y la frase óptica. NO utilices títulos, guiones ni apartados separados. La respuesta COMPLETA debe ser un único párrafo de aproximadamente 600 caracteres (alrededor de 100 palabras) en total.`;

  const userMessage = `CONSULTA DE TAROT DE MARSELLA:

Tirada de cartas: ${cartasList}
Pregunta / Tema de consulta: "${pregunta}"

INSTRUCCIONES DE INTERPRETACIÓN:
1. Describe y analiza los elementos visuales basándote en la tradición del Tarot de Marsella y las imágenes provistas.
2. Explica el simbolismo NUMÉRICO y GEOMÉTRICO conjunto.
3. Interpreta según la TRADICIÓN MARSELLESA (Jodorowsky, Camoin, Marteau, etc.).
4. Menciona el significado de los COLORES y su disposición espacial (miradas, gestos, direcciones).
5. Explica el diálogo conjunto entre las cartas (frase óptica).

RECUERDA: NO uses referencias del Rider-Waite. Responde en un único bloque de texto integrado y fluido de unos 600 caracteres en total. No incluyas títulos ni subtítulos.`;

  const userContent: any[] = [
    {
      type: 'text',
      text: userMessage,
    },
  ];

  // Enviar imágenes de Cloudinary si están disponibles y son absolutas
  const imageUrls = cartas
    .map((c) => c.imagem)
    .filter((img): img is string => typeof img === 'string' && img.startsWith('http'));

  for (const url of imageUrls) {
    userContent.push({
      type: 'image_url',
      image_url: {
        url: url,
      },
    });
  }

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
          { role: 'user', content: userContent },
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
  if (!saveAllowed) {
    const limit = getReadingLimit(profile.plan);
    warning = `Has alcanzado el limite de ${limit} tiradas de tu plan. Actualiza a premium para guardado ilimitado.`;
  }

  const metadatos = {
    tradicion: 'Tarot de Marsella',
    verificacionPureza: pureza,
  };

  return json({ interpretacion, warning, metadatos });
}