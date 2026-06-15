# Documento de Cambios UX/UI - 2026-06-14

## Objetivo de esta iteracion

Mejorar la experiencia de la tirada para que cartas, acciones de IA y feedback esten visibles en el mismo plano, con mejor jerarquia visual, colores consistentes y estados de interfaz claros.

## Archivos modificados

1. src/pages/cards/random-cards.astro
2. src/styles/global.css
3. src/styles/cards.css
4. src/layouts/Layout.astro
5. src/components/Navbar.astro
6. src/components/Footer.astro

## Cambios aplicados

### 1) Layout de tirada centrado en la accion

Archivo: src/pages/cards/random-cards.astro

- Se reemplazo la estructura lineal por una composicion en 2 columnas en desktop (`xl:grid-cols-12`):
  - Columna izquierda (`xl:col-span-8`): configuracion + cartas + aclaraciones.
  - Columna derecha (`xl:col-span-4`): acciones, feedback, panel de significado y resultado IA.
- El panel derecho usa posicion sticky en desktop (`xl:sticky xl:top-24`) para evitar scroll excesivo de control.
- La tirada mantiene una version apilada en mobile sin romper el flujo existente.

### 2) Acciones y feedback de IA en el mismo plano

Archivo: src/pages/cards/random-cards.astro

- Se movieron las acciones clave a `#actionPanel`:
  - Revelar todas
  - Sacar carta de aclaracion
  - Interpretar tirada
- Se mantuvo y mejoro el feedback inline (`#interpretarFeedback`) con estados claros:
  - loading
  - ok
  - error
- El resultado de IA se mantiene en un panel dedicado (`#interpretacionSection`) dentro del mismo lateral.

### 3) Prevencion de multiples solicitudes mientras carga IA

Archivo: src/pages/cards/random-cards.astro

- Se agrego `setActionsDisabled(disabled)` para bloquear todos los botones de accion durante la llamada a `/api/interpretar`.
- Durante carga:
  - se activa `aria-busy="true"` en la seccion de interpretacion
  - se deshabilitan botones para evitar estados inconsistentes
- Al finalizar o fallar:
  - se reactivan controles
  - se restablece `aria-busy="false"`

### 4) Significado cerca de la carta sin perder tirada

Archivo: src/pages/cards/random-cards.astro

- Se agrego panel lateral de significado para escritorio (`#cardMeaningPanel`).
- Al hacer clic en carta revelada:
  - en desktop ancho: se actualiza panel lateral (`renderMeaningPanel`) sin modal.
  - en pantallas menores: se mantiene modal existente (sin romper comportamiento previo).
- Se conserva el enlace a ficha completa con `returnTo`.

### 5) Gestion de contenido IA largo

Archivo: src/pages/cards/random-cards.astro

- Se agrego boton `#toggleInterpretacionBtn` para expandir/contraer el resultado.
- Se implemento `setInterpretationExpanded(expanded)`:
  - contraido por defecto (`max-h-52`)
  - expandido hasta altura mayor con scroll
- Se mantiene el boton para desplazamiento suave al bloque de resultado (`#interpretarScrollBtn`).

### 6) Sistema visual con tokens y soporte claro/oscuro

Archivo: src/styles/global.css

- Se agregaron variables CSS semanticas:
  - fondo/superficies/texto/borde
  - acciones: primario, secundario, warning, danger, success
- Se agrego bloque `@media (prefers-color-scheme: dark)` para adaptar colores al sistema.
- Se introdujeron utilidades reutilizables:
  - `.app-surface`
  - `.app-surface-soft`
  - `.btn-ui` y variantes (`primary`, `secondary`, `warning`, `neutral`)
  - `.status-box` y variantes de estado

### 7) Consistencia visual de cartas

Archivo: src/styles/cards.css

- Se actualizaron tarjetas para usar variables globales (`var(--surface)`, `var(--text)`, `var(--border)`).
- Se normalizo sombreado con `var(--shadow-soft)`.
- Se ajusto grid y espaciado para una lectura visual mas estable.
- Se mantuvieron clases existentes para no romper otras paginas (`major`, `minor`, `index`).

### 8) Unificacion de cabecera y pie (segunda pasada)

Archivos: src/components/Navbar.astro, src/components/Footer.astro

- Se reemplazo la paleta fija de Tailwind basada en `purple-*` por estilos ligados a tokens (`--primary`, `--border`, `--text-muted`).
- Se homogeneizo contraste de enlaces y estados hover para mejorar legibilidad en claro/oscuro.
- Se mantuvo la misma estructura de navegacion y el mismo comportamiento del menu mobile.
- Se agregaron estilos de separadores adaptados al tema para escritorio y mobile.

### 9) Adopcion global del tema en layout

Archivo: src/layouts/Layout.astro

- Se retiro `bg-gray-50` fijo del `body` para permitir que el fondo global con tokens y adaptacion a esquema del sistema se aplique en toda la app.

## Paleta aplicada (tokens principales)

- --bg: #f6f3ee
- --surface: #ffffff
- --surface-2: #f1ecf8
- --text: #1f1b2d
- --text-muted: #5c556f
- --border: #d9d1e3
- --primary: #6e3a9e
- --primary-hover: #5a2e85
- --secondary: #2f7a78
- --warning: #c78a2c
- --danger: #b84040
- --success: #2e8b57

## Compatibilidad y riesgos

- No se modifico la API de interpretacion.
- Se preservo la persistencia de estado en localStorage (`apptarot_random_reading_v1`).
- Se mantuvo modal de significado como fallback para mobile.
- Cambios compatibles con la arquitectura actual de Astro (script inline en pagina).

## Validacion tecnica

- Se ejecuto verificacion de errores en:
  - src/pages/cards/random-cards.astro
  - src/styles/global.css
  - src/styles/cards.css
  - src/layouts/Layout.astro
  - src/components/Navbar.astro
  - src/components/Footer.astro
- Resultado: sin errores detectados por analisis de editor.
