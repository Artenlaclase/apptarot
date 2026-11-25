# Documento técnico: autenticación, cuentas, planes y privacidad

## Proyecto
AppTarot

## Fecha
15 de junio de 2026

## Resumen
Se implementó un sistema completo de cuentas de usuario con Firebase Authentication, persistencia de tiradas en Firestore por usuario, control de límites por plan, integración base de suscripciones con Stripe, rutas privadas en Astro SSR y páginas de perfil/historial/premium.

## Objetivos cubiertos
1. Registro y login con email/contraseña y Google.
2. Protección de datos con sesiones HTTP-only y reglas Firestore por UID.
3. Guardado automático de tiradas e interpretación IA por usuario.
4. Historial de tiradas con detalle y eliminación.
5. Sistema de planes (free con límite y premium ilimitado).
6. Funciones premium: videollamada y chat personal.
7. Integración de pagos por Stripe Checkout + portal + webhook.
8. Perfil de usuario con plan actual, cambio de contraseña, suscripción y exportación GDPR.

## Arquitectura implementada

### 1) Autenticación
- Cliente: Firebase Auth en src/lib/auth-client.ts.
- Servidor: Firebase Admin en src/lib/firebase-admin.ts + src/lib/auth-server.ts.
- Sesión SSR: endpoint src/pages/api/auth/session-login.ts genera cookie HTTP-only.
- Cierre de sesión SSR: src/pages/api/auth/session-logout.ts.
- Endpoint de perfil autenticado: src/pages/api/auth/me.ts.

### 2) Protección de rutas privadas
- Middleware global en src/middleware.ts.
- Rutas privadas protegidas por prefijos:
  - /profile
  - /account/*
  - /premium/*
- Si no hay sesión, redirección a /auth/login con parámetro next.

### 3) Persistencia de tiradas
- Endpoint IA modificado: src/pages/api/interpretar.ts.
- Comportamiento:
  - Verifica sesión autenticada.
  - Genera interpretación con OpenAI.
  - Guarda lectura en users/{uid}/readings/{readingId}.
  - Incrementa readingCount en users/{uid}.
  - Aplica límite según plan (free hasta 10, premium ilimitado).

### 4) Planes y límites
- Lógica central en src/lib/plans.ts.
- Planes:
  - free
  - premium_monthly
  - premium_annual
- Regla:
  - free: máximo 10 tiradas guardadas.
  - premium: guardado ilimitado.

### 5) Stripe
- Cliente Stripe en src/lib/stripe.ts.
- Checkout suscripción: src/pages/api/stripe/create-checkout-session.ts.
- Portal de facturación: src/pages/api/stripe/portal.ts.
- Webhook de eventos: src/pages/api/stripe/webhook.ts.
- Eventos gestionados:
  - checkout.session.completed
  - customer.subscription.created
  - customer.subscription.updated
  - customer.subscription.deleted
- Actualiza campos de plan/status en users/{uid}.

### 6) Páginas nuevas

#### Auth
- src/pages/auth/login.astro
- src/pages/auth/register.astro

#### Perfil y cuenta
- src/pages/profile.astro
- src/pages/account/readings/index.astro
- src/pages/account/readings/[id].astro

#### Premium
- src/pages/premium/call.astro (agenda por Cal.com/Zoom)
- src/pages/premium/chat.astro (base para chat personal)

### 7) Firestore: estructura propuesta

Colección users
- users/{uid}
  - email
  - displayName
  - plan
  - planStatus
  - stripeCustomerId
  - stripeSubscriptionId
  - subscriptionCurrentPeriodEnd
  - readingCount
  - createdAt
  - updatedAt

Subcolección readings
- users/{uid}/readings/{readingId}
  - uid
  - cards[]
  - interpretation
  - source
  - createdAt
  - updatedAt

### 8) Reglas e índices Firestore
- Reglas: firestore.rules
- Índices: firestore.indexes.json

### 9) GDPR
- Exportación de datos: GET /api/user/export
- Descarga JSON con perfil y tiradas del usuario autenticado.

### 10) Privacidad y términos
- src/pages/privacy.astro actualizado para datos, finalidades, proveedores y derechos GDPR.
- src/pages/terms.astro actualizado para planes, suscripción y limitaciones.

## Variables de entorno requeridas

### Firebase cliente
- PUBLIC_FIREBASE_API_KEY
- PUBLIC_FIREBASE_AUTH_DOMAIN
- PUBLIC_FIREBASE_PROJECT_ID
- PUBLIC_FIREBASE_STORAGE_BUCKET
- PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- PUBLIC_FIREBASE_APP_ID

### Firebase Admin
- FIREBASE_ADMIN_PROJECT_ID
- FIREBASE_ADMIN_CLIENT_EMAIL
- FIREBASE_ADMIN_PRIVATE_KEY

### OpenAI
- OPENAI_API_KEY

### Stripe
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- STRIPE_PRICE_MONTHLY
- STRIPE_PRICE_ANNUAL

### URLs
- PUBLIC_APP_URL
- PUBLIC_CALCOM_BOOKING_URL (opcional)
- SITE_URL

## Flujo funcional final
1. Usuario se registra o inicia sesión.
2. Se crea cookie de sesión SSR.
3. Usuario hace tirada e interpreta con IA.
4. Endpoint guarda lectura asociada al UID.
5. Usuario ve historial, detalle o elimina lectura.
6. Si llega al límite free, recibe aviso para upgrade.
7. Usuario inicia checkout premium en Stripe.
8. Webhook actualiza plan y habilita funcionalidades premium.
9. Usuario gestiona suscripción en portal Stripe.
10. Usuario exporta sus datos desde perfil (GDPR).

## Accesibilidad y rendimiento aplicados
- Formularios con etiquetas asociadas y validaciones básicas.
- Mensajes en regiones aria-live para feedback.
- SSR y cookies HTTP-only para seguridad de sesión.
- Carga de datos por usuario bajo demanda en páginas privadas.
- Persistencia segmentada en subcolecciones para escalar lecturas.

## Pendientes recomendados
1. Añadir reautenticación para cambio de contraseña sensible en cliente.
2. Implementar decremento de readingCount al eliminar para sincronía estricta de límite.
3. Integrar proveedor real de chat en tiempo real con auditoría.
4. Añadir pruebas e2e de flujos login/checkout/webhook.
5. Configurar Firebase App Check y monitorización de fraude.
