# Registro de Cambios — AppTarot

---

## Fecha: 26 de julio de 2026

---

## 10. Protocolo estricto del Tarot de Marsella y control de pureza para interpretación de IA

### Problema
Las interpretaciones generadas por la IA podían mezclar conceptos del Tarot de Rider-Waite-Smith (simbolismo new age, psicología junguiana, asociaciones astrológicas modernas) en lugar de ceñirse estrictamente a la tradición clásica del Tarot de Marsella.

### Solución aplicada

**Archivo:** `src/pages/api/interpretar.ts`

- **System Prompt Estricto**: Se definió un prompt de sistema robusto con reglas obligatorias para basarse únicamente en la tradición marsellesa (geometría sagrada, colores primarios medievales, disposición espacial, miradas y gestos de los personajes, leyes de 3+1 y repetición, etc.).
- **Vocabulario Prohibido y Permitido**: Se restringieron explícitamente términos de Rider-Waite como "viaje del héroe", "sombra junguiana" e "inconsciente colectivo", indicando las correspondencias marsellesas correctas ("lámina", "triunfo", "palo de bastos/copas/espadas/oros").
- **Función de Control de Pureza `verificarPurezaMarsella`**: Se implementó una función para inspeccionar la interpretación generada y verificar que no contenga contaminaciones de Rider-Waite.
- **Persistencia en Firestore y Respuesta API**:
  - Los metadatos de validación (incluyendo la pureza y los términos detectados) ahora se guardan en el documento de la lectura en Firestore (`readings`).
  - La API retorna los metadatos de pureza en el objeto `metadatos.verificacionPureza`.
- **Corrección de Tipado TypeScript (`UserPlan`)**: Se corrigió la comparación del plan del usuario. El tipo de datos `UserPlan` utiliza el identificador `'free'` internamente para el plan gratuito en lugar de `'caminante'` (el cual es la etiqueta de presentación visual). Esto resolvió el error de compilación de TypeScript (TS2367).

---

## 12. Ajuste de formato corto de IA, pregunta por defecto y carga multimodal de imágenes en la tirada

### Problema
- El formato de respuesta era demasiado largo y estructurado por apartados, en lugar de un mensaje tradicional directo de 600 caracteres.
- Se producían alucinaciones visuales en cartas menores (ej. describir jinetes o caballos en el Seis de Bastos) debido a la memoria cruzada de Rider-Waite.
- Si el usuario no ingresaba una pregunta, la interpretación se generaba sin un contexto de consulta definido.

### Solución aplicada

**Archivo:** `src/pages/api/interpretar.ts`

- **Formato Corto de 600 Caracteres**: Se reescribieron las instrucciones del system prompt para obligar a la IA a devolver un único párrafo integrado y fluido de aproximadamente 600 caracteres (~100 palabras) sin apartados ni títulos.
- **Evitar Figuras en Palos Menores**: Se introdujo una regla crítica explicitando que las cartas del 1 al 10 de Bastos, Copas, Espadas y Oros son naipes abstractos y geométricos sin personajes humanos, caballos ni jinetes.
- **Carga de Imágenes a OpenAI**: Se implementó el envío multimodal de las imágenes de las cartas reales (urls absolutas de Cloudinary) en el cuerpo del payload de OpenAI (`type: "image_url"`). Esto permite que el modelo analice visualmente los detalles reales de la lámina de Marsella.
- **Pregunta por Defecto**: Si no se provee pregunta en la consulta, se inicializa automáticamente como: *"¿Cuál es la energía actual del consultante?"*.

---

## 11. Corrección de límites de guardado, límite de interpretaciones por sesión y navegación del historial

### Problema
- En el plan Caminante (gratuito) se permitía seguir guardando lecturas superando el límite de 3 a través del botón manual de guardado.
- Las tiradas guardadas de forma manual a través del endpoint `/api/readings/save` fallaban al renderizar las cartas porque se guardaban solo los IDs (strings) en vez de los objetos de cartas completos. Además, se guardaba el campo `createdAt` como Timestamp directo, provocando que la página de historial renderizara la fecha como `Invalid Date`.
- No se estaba controlando el límite de interpretaciones por sesión del plan activo (Caminante: 1, Buscador: 2, Guía: 3).
- No había forma de regresar al Perfil desde la página del Historial de Tiradas (`/account/readings`).

### Solución aplicada

**11a. Límite de guardado en el backend y consistencia de datos**
**Archivo:** `src/pages/api/readings/save.ts`
- Se agregó el chequeo del límite de guardado en el endpoint usando `canSaveReading` y `getReadingLimit`. Si el límite se supera, se retorna un código HTTP 403 con el mensaje del error correspondiente.
- Se formateó la propiedad `createdAt` para persistirla como string ISO (`new Date().toISOString()`), unificándolo con `/api/interpretar.ts` y evitando el bug de `Invalid Date`.

**11b. Guardado de objetos de cartas completos**
**Archivo:** `src/pages/cards/random-cards.astro`
- Se modificó el evento de click de `guardarInterpretacionBtn` para recopilar y enviar el objeto de carta completo (`cartasReveladas`) al endpoint `/api/readings/save` en vez de mandar solo un array de IDs (strings). Esto soluciona que las cartas guardadas manualmente aparezcan vacías o sin nombre.

**11c. Control de interpretaciones de IA por sesión**
**Archivo:** `src/pages/cards/random-cards.astro`
- Se implementó la verificación de límite de interpretaciones mediante `sessionStorage` en el cliente. Se lee el plan actual (`free` u otros) y se valida que la cantidad de interpretaciones generadas en la sesión actual de navegación no exceda el cupo de su membresía (1 para Caminante, 2 para Buscador, 3 para Guía).

**11d. Robustez y navegación del historial**
**Archivos:** `src/pages/account/readings/index.astro`, `src/pages/account/readings/[id].astro`
- Se introdujo una función utilitaria de sanitizado y parseo de fechas de Firestore (`formatFirestoreDate`) para soportar fechas almacenadas tanto en string como en Timestamp sin fallos de renderizado.
- Se agregaron validaciones en los renderers de la lista e individual para soportar compatibilidad con tiradas antiguas (que tenían array de strings) y las nuevas tiradas (que guardan objetos completos).
- Se añadió el botón/enlace `← Volver a mi perfil` en la cabecera de la página `/account/readings`.

---

## Archivos modificados (27 jul 2026)

| Archivo | Operación |
|---|---|
| `src/pages/api/readings/save.ts` | Modificado |
| `src/pages/cards/random-cards.astro` | Modificado |
| `src/pages/account/readings/index.astro` | Modificado |
| `src/pages/account/readings/[id].astro` | Modificado |

---

## Fecha: 14 de junio de 2026

---

## 8. Persistencia de tirada y significado de cartas in-page

### Problema
Al hacer clic en una carta revelada la aplicación navegaba a `/cards/[id]`, sacando al usuario de la lectura activa y perdiendo el contexto de la tirada.

### Solución aplicada

**8a. Modal de significado en la página de tirada**

**Archivo:** `src/pages/cards/random-cards.astro`

- Las cartas reveladas ya no generan un enlace `<a href="/cards/[id]">`.  
  Ahora renderizan un `<button class="carta-detail-trigger" data-card-id="...">` que abre un modal en la misma página.
- El modal (`#cardMeaningModal`) muestra: nombre, imagen, significado directo, invertido y símbolos clave.
- Cierre mediante botón `×`, clic en el fondo oscuro o tecla `Escape`.
- El modal incluye un enlace "Ir a ficha completa" que navega a `/cards/[id]?returnTo=/cards/random-cards`.

**8b. Retorno explícito desde el detalle de carta**

**Archivo:** `src/pages/cards/[id].astro`

- Se lee y valida el query param `returnTo` (solo se acepta si comienza con `/cards/random-cards`).
- Si el parámetro existe, se muestra el botón **"← Volver a mi tirada actual"** encima del enlace estándar "Volver al mazo completo".

**8c. Persistencia de la tirada en `localStorage`**

**Archivo:** `src/pages/cards/random-cards.astro`

Clave de almacenamiento: `apptarot_random_reading_v1`

Estado persistido:
- Modalidad de tirada y número de cartas.
- Orden y IDs de las cartas seleccionadas.
- IDs de cartas reveladas.
- IDs de cartas de aclaración.
- HTML de la interpretación generada por IA.

Reglas de ciclo de vida:
| Acción | Efecto sobre estado |
|---|---|
| Revelar carta | Guarda estado |
| Interpretar tirada (éxito) | Guarda estado |
| Sacar carta de aclaración | Guarda estado |
| Barajar cartas | Sobreescribe estado |
| Limpiar | Elimina estado |

- Al cargar la página, `restoreReadingState()` reconstruye automáticamente la tirada desde `localStorage`.

---

## 9. Feedback inline del botón "Interpretar Tirada"

### Problema
El spinner y el resultado de la interpretación se mostraban únicamente en el footer, fuera del viewport. El usuario no percibía la carga y podía hacer clic múltiples veces.

### Solución aplicada

**Archivo:** `src/pages/cards/random-cards.astro`

**9a. Zona de feedback inline (HTML)**

Se añadió el bloque `#interpretarFeedback` inmediatamente bajo el botón "✨ Interpretar Tirada", con tres sub-estados visuales:

| ID | Cuándo se muestra | Contenido |
|---|---|---|
| `#interpretarFeedbackLoading` | Durante la petición | Spinner animado + "Generando interpretación..." |
| `#interpretarFeedbackOk` | Petición exitosa | "✓ Interpretación lista" + botón "Ver resultado ↓" |
| `#interpretarFeedbackError` | Error de red o de API | Mensaje de error descriptivo en rojo |

**9b. Función `setInterpretarFeedback(state, errorMsg)`**

Gestiona los tres estados de forma exclusiva: oculta los demás antes de mostrar el activo. Estados posibles: `'loading'`, `'ok'`, `'error'`, `'hidden'`.

**9c. Comportamiento actualizado de `interpretar()`**

1. Clic en el botón → botón deshabilitado con texto "Consultando..." + feedback `loading` visible.
2. Respuesta exitosa → botón habilitado + feedback `ok` + scroll suave automático a `#interpretacionSection` (400 ms de retardo).
3. Error de API o de red → botón habilitado + feedback `error` con mensaje descriptivo; la sección del footer se oculta.
4. Limpiar tirada → `setInterpretarFeedback('hidden')` resetea la zona de feedback.

---

## Archivos modificados (14 jun 2026)

| Archivo | Operación |
|---|---|
| `src/pages/cards/random-cards.astro` | Modificado (cambios 8 y 9) |
| `src/pages/cards/[id].astro` | Modificado (cambio 8b) |

---

## Fecha: 22 de marzo de 2026

---

## 1. Corrección del bug principal: botón "Barajar Cartas" no funcionaba

**Archivo:** `src/pages/cards/random-cards.astro`

**Causa raíz:** El script utilizaba `<script define:vars={{ allCards, arcanosMayores, arcanosMenores }}>` para pasar 78 objetos de cartas al cliente. El bundler de Astro fallaba silenciosamente al serializar esa cantidad de datos, impidiendo que el JavaScript se ejecutara.

**Solución aplicada:**
- Los datos de las cartas se embeben ahora como JSON puro en una etiqueta `<script id="tarot-data" type="application/json">`, que el navegador no procesa como código.
- El script del cliente se reescribió como `<script is:inline>` con un IIFE en ES5 estándar, sin pasar por el bundler de Astro.
- El script lee los datos en tiempo de ejecución con `JSON.parse(document.getElementById('tarot-data').textContent)`.

---

## 2. Rediseño del modelo de volteo de cartas

**Archivo:** `src/pages/cards/random-cards.astro`

**Cambios:**
- Antes: las cartas compartían un pool global (`availableCards`) con índices numéricos; el mecanismo de flip era frágil y dependía de estado mutable compartido.
- Ahora: cada carta boca abajo almacena su carta asignada directamente en `dataset.card = JSON.stringify(card)`. Al hacer clic, la carta lee su propio dato y se revela — sin estado compartido.
- Animación de volteo con clase CSS `.flipping` (rotación Y 90°) seguida de `.card-revealed` al reemplazar el contenido.

---

## 3. Limpieza del HTML de controles

**Archivo:** `src/pages/cards/random-cards.astro`

| Elemento | Antes | Ahora |
|---|---|---|
| Contenedor de controles | `<form method="get">` con parámetros GET | `<div>` simple |
| Botones | `type="submit"` | `type="button"` |
| Input de número | Sin `value` inicial | `value="3"` |
| Lógica server-side | `initialDraw`, `shuffleServer`, query params | Eliminada completamente |

---

## 4. Nuevo botón: Revelar Todas

**Archivo:** `src/pages/cards/random-cards.astro`

- Botón **"🃏 Revelar Todas"** añadido en la barra de controles secundarios (visible tras barajar).
- Función `revelarTodas()`: busca todas las cartas con `data-revealed="0"` y las voltea con un efecto escalonado de **180 ms** entre cada una para una animación fluida.

---

## 5. Nueva funcionalidad: Interpretación IA de la tirada

### 5a. Endpoint API

**Archivo nuevo:** `src/pages/api/interpretar.ts`

- Ruta `POST /api/interpretar`
- Recibe un array de cartas reveladas `{ cartas: CartaInput[] }`.
- Construye un prompt en español para el Tarot de Marsella y llama a la API de **OpenAI** (`gpt-4o-mini`).
- La clave API nunca se expone al cliente — la llamada se realiza exclusivamente en el servidor.
- Manejo de errores con mensajes descriptivos:
  - `401` → clave inválida
  - `429` → sin crédito en la cuenta
  - `503` → clave no configurada

### 5b. Interfaz en la página

**Archivo:** `src/pages/cards/random-cards.astro`

- Botón **"✨ Interpretar Tirada"** en la barra de controles secundarios.
- Sección `#interpretacionSection` con spinner de carga y texto resultante.
- El texto se muestra en párrafos con estilo itálico en color púrpura.
- La sección se limpia al pulsar "Limpiar".

---

## 6. Configuración de variable de entorno

**Archivo:** `.env`

```
OPENAI_API_KEY=sk-proj-...   ← tu clave de https://platform.openai.com/api-keys
```

> **Nota:** La cuenta de OpenAI asociada a la clave debe tener crédito disponible. Sin saldo, el servidor devuelve HTTP 429. Añadir saldo en https://platform.openai.com/billing.

---

## 7. Corrección de la clave OpenAI

**Archivo:** `.env`

- La clave tenía un espacio erróneo (`sk-proj Aqh8...`) que OpenAI rechazaba con error 401.
- Corregido a `sk-proj-Aqh8...` (con guión, sin espacio).
- Adicionalmente, el endpoint ahora aplica `.replace(/\s/g, '')` a la clave antes de usarla como salvaguarda.

---

## Flujo completo de uso (estado actual)

1. Selecciona modalidad: **Solo Arcanos Mayores** o **Tirada Mixta**
2. Elige el número de cartas (1–13)
3. Pulsa **Barajar Cartas** → aparecen N cartas boca abajo
4. Haz clic en cada carta para revelarla individualmente, **o**
5. Pulsa **🃏 Revelar Todas** para voltearlas todas con animación escalonada
6. Pulsa **✨ Interpretar Tirada** → el oráculo IA genera una interpretación
7. Opcionalmente, pulsa **Sacar Carta de Aclaración** para añadir arcanos menores revelados
8. **Limpiar** reinicia todo

---

## Archivos modificados / creados

| Archivo | Operación |
|---|---|
| `src/pages/cards/random-cards.astro` | Modificado |
| `src/pages/api/interpretar.ts` | Creado |
| `.env` | Modificado (añadida `OPENAI_API_KEY`) |
