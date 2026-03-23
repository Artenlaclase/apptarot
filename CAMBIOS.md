# Registro de Cambios — AppTarot

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
