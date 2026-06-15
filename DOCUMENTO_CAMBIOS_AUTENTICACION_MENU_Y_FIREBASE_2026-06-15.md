# Documento de cambios: autenticación, menú y Firebase

## Proyecto
AppTarot

## Fecha
15 de junio de 2026

## Objetivo
Registrar de forma clara todos los cambios implementados en autenticación, cuentas, planes, navegación, seguridad Firestore y configuración de Firebase Admin, incluyendo incidencias detectadas y su estado.

---

## 1. Autenticación y cuentas de usuario

### 1.1 Registro e inicio de sesión
Se implementó autenticación con Firebase Authentication:
- Email/contraseña
- Google

Archivos principales:
- `src/pages/auth/login.astro`
- `src/pages/auth/register.astro`
- `src/lib/auth-client.ts`

### 1.2 Sesión segura en servidor (SSR)
Se añadió flujo de sesión de servidor con cookie HTTP-only para proteger rutas y APIs SSR.

Archivos:
- `src/pages/api/auth/session-login.ts`
- `src/pages/api/auth/session-logout.ts`
- `src/pages/api/auth/me.ts`
- `src/lib/auth-server.ts`

### 1.3 Perfil de usuario y GDPR
Se creó página de perfil para:
- Ver plan actual
- Cambiar contraseña
- Exportar datos personales (GDPR)

Archivos:
- `src/pages/profile.astro`
- `src/pages/api/user/export.ts`

---

## 2. Guardado de tiradas e historial

### 2.1 Guardado automático de tiradas
El endpoint de interpretación IA ahora:
- Verifica sesión autenticada
- Genera interpretación
- Guarda la tirada en Firestore bajo el usuario
- Actualiza contador de tiradas

Archivo:
- `src/pages/api/interpretar.ts`

### 2.2 Historial de tiradas
Se añadieron vistas de historial:
- Listado de tiradas
- Detalle de tirada
- Eliminación de tirada

Archivos:
- `src/pages/account/readings/index.astro`
- `src/pages/account/readings/[id].astro`
- `src/pages/api/readings/delete.ts`

---

## 3. Planes y suscripciones

### 3.1 Lógica de planes
Se implementó control de planes:
- Free: límite de 10 tiradas guardadas
- Premium mensual/anual: ilimitado

Archivo:
- `src/lib/plans.ts`

### 3.2 Integración Stripe
Se añadieron endpoints para:
- Crear sesión de checkout
- Abrir portal de facturación
- Procesar webhook de eventos de suscripción

Archivos:
- `src/lib/stripe.ts`
- `src/pages/api/stripe/create-checkout-session.ts`
- `src/pages/api/stripe/portal.ts`
- `src/pages/api/stripe/webhook.ts`

---

## 4. Rutas privadas y middleware

Se incorporó middleware global con guard de sesión para rutas privadas.

Protección aplicada a:
- `/profile`
- `/account/*`
- `/premium/*`
- `/cards/random-cards` (lectura)

Archivo:
- `src/middleware.ts`

---

## 5. Cambios de menú y navegación (solicitado)

### 5.1 Navbar
Se ajustó el menú según sesión:

Sin sesión:
- Mazo Completo
- Acerca del Tarot
- Lectura
- Redes sociales

Con sesión:
- Mazo Completo
- Acerca del Tarot
- Lectura
- Mi Perfil
- Historial
- Redes sociales

Además:
- Se renombró `Tiradas` a `Lectura`
- Click en `Lectura` redirige a login si no hay sesión

Archivo:
- `src/components/Navbar.astro`

### 5.2 Footer
Se renombró `Tiradas` a `Lectura` y se igualó comportamiento de acceso:
- Sin sesión -> login
- Con sesión -> lectura directa

Archivo:
- `src/components/Footer.astro`

---

## 6. Firestore: reglas e índices

### 6.1 Reglas de seguridad
Se añadieron reglas por usuario (UID) para proteger datos personales y subcolecciones.

Archivo:
- `firestore.rules`

### 6.2 Índices
Se ajustó archivo de índices para evitar error de despliegue por índice no necesario.

Archivo:
- `firestore.indexes.json`

### 6.3 Despliegue realizado
Se desplegó con éxito:
- Reglas
- Índices

Proyecto:
- `cartasmagicas-58d96`

Configuración CLI añadida:
- `firebase.json`
- `.firebaserc`
- Scripts npm en `package.json`

---

## 7. Firebase Admin: robustez y manejo de errores

### 7.1 Inicialización segura de Firebase Admin
Se reforzó inicialización para evitar caída completa al cargar middleware si falla Admin SDK.

Archivo:
- `src/lib/firebase-admin.ts`

### 7.2 Errores más claros en login de sesión de servidor
Se mejoró respuesta en `session-login` para distinguir:
- Credencial revocada/invalid_grant
- Private key malformada
- Admin SDK no disponible

Archivo:
- `src/pages/api/auth/session-login.ts`

---

## 8. Documentación y legales

Se actualizaron políticas y documentación técnica:
- `src/pages/privacy.astro`
- `src/pages/terms.astro`
- `README.md`
- `DOCUMENTO_AUTENTICACION_CUENTAS_Y_PLANES_2026-06-15.md`

Se incorpora este nuevo documento:
- `DOCUMENTO_CAMBIOS_AUTENTICACION_MENU_Y_FIREBASE_2026-06-15.md`

---

## 9. Incidencias detectadas durante implementación

### 9.1 Error `MiddlewareCantBeLoaded`
Causa: excepción en inicialización de Firebase Admin al cargar middleware.
Estado: resuelto con inicialización segura y fallback controlado.

### 9.2 Error `invalid_grant: account not found` en session-login
Causa probable:
- Reloj del sistema sin sincronizar (confirmado en máquina local)
- O clave de service account revocada

Estado: pendiente operativo del entorno local (no de código de app).

---

## 10. Estado actual

### Completado
- Flujo funcional de autenticación y sesión SSR
- Guardado e historial de tiradas
- Planes y base de monetización
- Navegación por estado de sesión
- Reglas/índices Firestore desplegados
- Documentación técnica y legal actualizada

### Pendiente operativo (entorno)
1. Sincronizar hora del sistema Windows con privilegios de administrador.
2. Regenerar/revocar key de Firebase Admin si la actual fue comprometida o revocada.
3. Validar login Google end-to-end tras corregir punto 1 y/o 2.

---

## 11. Recomendación de seguridad urgente

La private key de Firebase Admin fue expuesta durante pruebas.
Acciones recomendadas inmediatas:
1. Revocar la key actual en IAM.
2. Generar una nueva key.
3. Reemplazar variables en `.env`.
4. No compartir ni versionar keys en texto plano.
