# Tarot de Marsella — Astro

Sitio en Astro para explorar el Tarot de Marsella: cartas, descripciones, tiradas aleatorias con volteo interactivo e interpretación generada por IA.

## Estructura

```
public/
src/
  components/       # Navbar, Footer, Head
  layouts/          # Layout.astro, AdminLayout.astro
  lib/              # firebase.ts
  pages/
    api/
      interpretar.ts  # Endpoint POST — interpretación IA con OpenAI
    cards/
      [id].astro        # Detalle de carta
      index.astro
      major.astro
      minor.astro
      random-cards.astro  # Tirada aleatoria con flip y IA
    index.astro
    about.astro
    meanings.astro
    privacy.astro
    terms.astro
    cookies.astro
  styles/           # global.css, cards.css, admin.css
```

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo en http://localhost:4321 |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Sirve la build generada localmente |

## Variables de entorno

Crea un archivo `.env` en la raíz con las siguientes variables:

```env
# Firebase — base de datos de cartas
PUBLIC_FIREBASE_API_KEY=...
PUBLIC_FIREBASE_AUTH_DOMAIN=...
PUBLIC_FIREBASE_PROJECT_ID=...
PUBLIC_FIREBASE_STORAGE_BUCKET=...
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
PUBLIC_FIREBASE_APP_ID=...

# OpenAI — interpretación IA de tiradas (requiere crédito en la cuenta)
# Obtén tu clave en: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-proj-...

# Firebase Admin SDK (servidor SSR / API)
FIREBASE_ADMIN_PROJECT_ID=...
FIREBASE_ADMIN_CLIENT_EMAIL=...
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Stripe (suscripciones)
STRIPE_SECRET_KEY=sk_live_or_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MONTHLY=price_...
STRIPE_PRICE_ANNUAL=price_...

# URL pública de la app (redirects checkout/portal)
PUBLIC_APP_URL=http://localhost:4321

# Integración premium de videollamada (opcional)
PUBLIC_CALCOM_BOOKING_URL=https://cal.com/tu-equipo/lectura-tarot

# URL canónica para sitemap (solo producción)
SITE_URL=https://tusitio.com
```

> **Nota:** Sin `OPENAI_API_KEY` válida con saldo disponible, el botón "Interpretar Tirada" devolverá un mensaje de error descriptivo. El resto de la aplicación funciona con normalidad.

## Funcionalidades principales

### Tirada aleatoria (`/cards/random-cards`)
- Selección de modalidad: **Solo Arcanos Mayores** (22 cartas) o **Tirada Mixta** (78 cartas)
- Número de cartas configurable (1–13)
- Las cartas aparecen **boca abajo** al barajar
- **Volteo individual** — clic en cada carta para revelarla con animación
- **Revelar Todas** — voltea todas las cartas con efecto escalonado
- **Carta de Aclaración** — saca un arcano menor adicional (siempre revelado)
- **✨ Interpretar Tirada** — genera una interpretación en español usando `gpt-4o-mini` de OpenAI basada en las cartas reveladas

### Cartas
- 78 cartas cargadas desde Firebase Firestore (22 arcanos mayores, 56 menores)
- Imágenes servidas desde Cloudinary con transformaciones automáticas (`w_380,f_auto,q_auto`)

## Configuración

- **Astro 5** en modo `server` con adaptador `@astrojs/node` (SSR)
- **TailwindCSS 3** con PostCSS
- **Sitemap** automático con `@astrojs/sitemap`
- Meta etiquetas y Open Graph centralizadas en `src/components/Head.astro`
- Páginas legales incluidas: `privacy`, `terms`, `cookies`
- `robots.txt` y `site.webmanifest` en `public/`

