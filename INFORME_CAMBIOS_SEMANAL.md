# Informe Semanal de Cambios y Actualizaciones — Tarot Terapéutico
**Periodo:** 22 de junio de 2026 - 25 de junio de 2026

Este documento detalla todas las actualizaciones, refactorizaciones, nuevas características y correcciones de errores que se han realizado en la aplicación durante esta semana.

---

## Resumen de Cambios

Durante esta semana se realizaron importantes integraciones estructurales para dotar a la aplicación de un sistema de autenticación seguro, una pasarela de pago para planes premium, un oráculo de interpretación de tiradas potenciado por Inteligencia Artificial y una renovación total de la interfaz con un sistema de diseño moderno, responsive y accesible.

---

## 1. Sistema de Autenticación e Integración con Firebase

Se ha implementado una arquitectura de autenticación híbrida que combina la reactividad en el cliente mediante el SDK de Firebase Auth y la seguridad en el servidor a través de middleware y cookies cifradas (`Firebase Admin SDK`).

### Componentes Clave:
- **Middleware de Servidor (`src/middleware.ts`):** 
  - Intercepta las solicitudes en rutas protegidas (`/account/*`, `/premium/*`, `/profile/*`, `/cards/random-cards`).
  - Verifica la cookie de sesión (`apptarot_session`) de forma síncrona. Si el usuario no tiene una sesión activa en el servidor, lo redirige al flujo de inicio de sesión con el parámetro `next` para no perder su navegación de origen.
- **Rutas de API de Autenticación (`src/pages/api/auth/*`):**
  - `/api/auth/session-login`: Recibe el `idToken` de Firebase del cliente, valida la identidad, genera la cookie de sesión y crea o recupera el perfil del usuario en Firestore.
  - `/api/auth/session-logout`: Limpia las cookies de sesión del servidor y destruye el estado.
- **Páginas de Flujo de Autenticación:**
  - **Inicio de Sesión (`src/pages/auth/login.astro`):** Admite ingreso tradicional con Email/Contraseña y autenticación OAuth mediante Google.
  - **Creación de Cuenta (`src/pages/auth/register.astro`):** Permite el registro de nuevos usuarios integrando un formulario de datos personales (nombre completo, fecha y hora de nacimiento) requeridos para el posterior cálculo de su perfil astrológico.

---

## 2. Renovación de Navegación y Sincronización Dinámica de Vistas

Se han unificado la cabecera y el pie de página mediante componentes altamente reutilizables.

### Componentes Clave:
- **Navbar (`src/components/Navbar.astro`):**
  - Soporta un diseño responsive (menú hamburguesa en móviles y enlaces expandidos en desktop).
  - **Icono de Usuario y Menú Desplegable (Dropdown):** Se reemplazó el enlace de texto "Iniciar sesión" por un icono circular de usuario posicionado a la extrema derecha del Navbar.
    - **Comportamiento Invitado:** Si el usuario no está autenticado, hacer clic en el icono redirige a la página de login.
    - **Comportamiento Autenticado:** Si el usuario está autenticado, al hacer clic se despliega un menú flotante con accesos directos a "Mi Perfil" y "Cerrar sesión" (logout).
    - **Control del Dropdown en Cliente (Vanilla JS):** Se implementó un control de apertura con accesos de accesibilidad (`aria-expanded`, `aria-haspopup`) y un detector de clics en `document` para cerrar el dropdown automáticamente cuando el usuario hace clic fuera del menú.
  - **Control de visibilidad condicional:** Elementos como `Mi Perfil` y `Cerrar sesión` se muestran solo a usuarios con sesión activa (usando selectores `data-auth-only` y `data-guest-only`), sincronizándose dinámicamente en tiempo real mediante el listener `onAuthStateChanged` de Firebase.
  - **Enlaces a Redes Sociales:** Se agregaron accesos directos a Facebook, Instagram y el nuevo enlace de **Spotify** (apuntando al show/podcast oficial de Tarot Terapéutico).
- **Footer (`src/components/Footer.astro`):**
  - Proporciona navegación secundaria clara y enlaces a las redes sociales del proyecto (incluyendo el nuevo icono y enlace de **Spotify**).
  - Incluye acceso a las páginas legales de reciente creación (Términos de servicio, Política de privacidad y Política de cookies).

---

## 3. Corrección Realizada Hoy: Flujo de Acceso al Menú "Lectura"

Se detectó y reparó un problema de regresión por el cual al hacer clic en el menú **Lectura** ya no se solicitaba iniciar sesión o registrarse a usuarios invitados.

### Soluciones Aplicadas:
1. **Sincronización Dinámica en el Cliente:**
   - En el menú principal (`Navbar.astro`) y el pie de página (`Footer.astro`), se agregó el atributo `data-lectura-link` a los enlaces de Lectura.
   - El script de cliente de `Navbar.astro` ahora intercepta el estado de autenticación y reescribe dinámicamente el `href` en tiempo de ejecución:
     - **Autenticado:** Redirige directamente a la tirada en `/cards/random-cards`.
     - **Invitado / Expirado:** Redirige a `/auth/login?next=%2Fcards%2Frandom-cards&message=lectura`.
2. **Propagación del Destino en el Registro:**
   - En la página de login (`login.astro`), al ingresar por el flujo de lectura se muestra el mensaje específico: **"Para realizar una experiencia personalizada, debes iniciar sesión o registrarte."**
   - El enlace de "Crear cuenta" en el login ahora propaga el parámetro `next` (`/auth/register?next=...`).
   - La página de registro (`register.astro`) ahora extrae el parámetro `next` y redirige al usuario a la lectura solicitada en lugar de enviarlo a su perfil por defecto al crear su cuenta.
3. **Auto-sincronización de Sesión en Login:**
   - Si un usuario ya tiene una sesión activa en Firebase client-side pero su cookie de servidor expiró, la página de login detecta esto mediante `onAuthStateChanged`, genera automáticamente la sesión de servidor y lo redirige a su destino original (`next`) de forma transparente sin obligarlo a ingresar sus credenciales nuevamente.
4. **Redirección de Retorno Inteligente y Dinámica (UX):**
   - Se modificaron los enlaces de inicio de sesión del icono de usuario (desktop) y del menú móvil en `Navbar.astro` para capturar dinámicamente la página actual (`Astro.url.pathname + Astro.url.search`) y pasarla en el parámetro `next`. Esto garantiza que al iniciar sesión desde cualquier página no protegida (como "Acerca del Tarot" o el "Mazo completo"), el usuario sea devuelto a la misma página desde donde hizo clic, evitando interrumpir su navegación actual.
   - En las páginas de inicio de sesión (`login.astro`) y registro (`register.astro`), se actualizó el destino por defecto cuando no existe el parámetro `next`, apuntando ahora a la página de inicio (`/`) en lugar de `/profile` para una experiencia inicial más natural y fluida.

---

## 4. Tirada de Cartas e Interpretación Oracular con IA

Se ha implementado una experiencia interactiva para realizar lecturas personalizadas.

### Componentes Clave:
- **Página de Tiradas (`src/pages/cards/random-cards.astro`):**
  - Permite configurar la modalidad de tirada (Solo Arcanos Mayores o Mazo Mixto) y seleccionar la cantidad de cartas (de 1 a 13).
  - Incluye animaciones fluidas de volteo de cartas.
  - Funcionalidad de **"Revelar Todas"** de manera escalonada para mejorar la experiencia de usuario.
  - Capacidad de agregar **"Cartas de Aclaración"** dinámicamente.
  - **Persistencia en LocalStorage:** El estado de la lectura (cartas elegidas, reveladas, aclaraciones y la interpretación generada) se persiste localmente para no perderse si el usuario navega a otras secciones del sitio y regresa.
- **Detalle de Carta en Ventana Modal:**
  - Al hacer clic en una carta revelada, se abre un modal in-page que muestra el significado directo, invertido y los símbolos de la carta sin interrumpir ni perder la tirada actual.
- **Oráculo IA (`src/pages/api/interpretar.ts`):**
  - Un endpoint seguro en el servidor que interactúa con la API de OpenAI (`gpt-4o-mini`).
  - Analiza la combinación de cartas seleccionadas y su orientación para devolver una interpretación coherente y adaptada al Tarot de Marsella Terapéutico.
  - Muestra un spinner de carga y feedback detallado directamente en la interfaz.

---

## 5. Gestión del Perfil de Usuario y Arcano Personal

Se ha desarrollado un panel privado para que los usuarios gestionen sus datos y descubran sus arquetipos personales.

### Componentes Clave:
- **Perfil de Usuario (`src/pages/profile/index.astro`):**
  - Muestra los datos de la cuenta, plan de suscripción activo y el historial de lecturas recientes guardadas en la base de datos Firestore.
  - **Visualización de datos de nacimiento:** Se añadieron a la cabecera del perfil la **Fecha de nacimiento** y **Hora de nacimiento** para que el usuario pueda visualizar siempre sus datos astrales guardados.
- **Cálculo del Arcano Personal:**
  - Implementa un algoritmo astrológico y numerológico basado en el nombre completo y la fecha de nacimiento ingresados por el usuario.
  - Asocia el número obtenido al Arcano Mayor correspondiente del Tarot de Marsella y muestra su significado terapéutico sugerido.
- **Edición de Perfil (`src/pages/profile/edit.astro`):**
  - Permite actualizar contraseñas, configurar enlaces a redes sociales, hobbies, biografía y exportar un archivo JSON con todos los datos y el historial de lecturas recopilado (conforme a regulaciones GDPR).
  - **Edición y Recálculo de Datos Natalicios:** Se agregaron inputs de tipo `date` y `time` al formulario de edición de datos personales, permitiendo actualizar la fecha y hora de nacimiento. Al guardarse, se validan en el cliente y el servidor, recalculando y actualizando automáticamente el Arcano Personal asociado en Firestore.

---

## 6. Integración de Planes de Suscripción Premium (Stripe)

Se definieron los planes de acceso para habilitar funcionalidades avanzadas en la plataforma.

### Características Clave:
- **Configuración de Planes (`src/lib/plans.ts`):**
  - Se definen los planes `free` (gratuito) y `premium` (acceso ilimitado y consultas por chat/video con tarotistas).
- **Checkout de Stripe (`src/pages/api/stripe/create-checkout-session.ts`):**
  - Endpoint de API para inicializar transacciones de suscripción de forma segura.
- **Portal del Cliente (`src/pages/api/stripe/portal.ts`):**
  - Permite a los usuarios gestionar su suscripción, métodos de pago y ver facturas dentro del entorno de Stripe.
- **Webhook de Stripe (`src/pages/api/stripe/webhook.ts`):**
  - Escucha eventos de facturación exitosa, actualización o cancelación para actualizar el estado del plan del usuario en Firestore de forma automática.

---

## 7. Sistema de Estilos y Diseño Premium

Toda la aplicación fue adaptada a un nuevo esquema visual premium y moderno.

### Características Clave:
- **Paleta de Colores HSL y Variables CSS (`src/styles/global.css`):**
  - Definición de colores sofisticados inspirados en una estética mística y premium (púrpuras profundos, dorados, fondos oscuros de gran legibilidad).
  - Soporte de transiciones suaves e interactividad dinámica en botones y enlaces.
- **Tipografía Exclusiva:**
  - Integración de fuentes optimizadas de Google Fonts (`Cardo` para encabezados con estilo clásico de Tarot, y `Montserrat` para textos de cuerpo legibles y limpios).
- **Optimización de Recursos y Rendimiento (Astro Assets):**
  - Se migró y renombró el logotipo de `public/logo-Tarot-1.PNG` a `src/assets/logo-Tarot-1.png`.
  - Se reemplazaron las etiquetas HTML nativas `<img>` en `Navbar.astro` y `Footer.astro` por el componente oficial `<Image />` de `astro:assets`. Esto permite que Astro optimice automáticamente la imagen (generando formatos modernos como WebP/AVIF y ajustando resoluciones de pantalla) mejorando significativamente la velocidad de carga y eliminando las advertencias de rendimiento de Astro. El renombrado a extensión en minúscula (`.png`) asegura compatibilidad con las declaraciones de tipos de TypeScript globales (`astro/client`).

---

## 8. Términos de Servicio, Políticas de Privacidad y Consentimiento de Registro

Se han implementado controles de conformidad y legalidad en el registro de usuarios, y se han rediseñado por completo las páginas de términos y políticas bajo el nuevo sistema visual.

### Características Clave:
- **Casilla de Conformidad en el Registro (`src/pages/auth/register.astro`):**
  - Se añadió una casilla de verificación obligatoria (checkbox) que exige a los usuarios declarar haber leído y aceptado los Términos de Servicio y la Política de Privacidad del sitio antes de crear su cuenta.
  - Implementación de validación del lado del cliente en el controlador de envío del formulario (`registerForm`), deteniendo el flujo y mostrando un mensaje de advertencia claro si el usuario intenta registrarse sin marcar la aceptación.
- **Actualización y Rediseño de Términos de Servicio (`src/pages/terms.astro`):**
  - Se renovó el diseño con secciones legibles, tipografía coherente y tablas responsivas con bordes suaves que admiten visualización móvil.
  - Se definieron formalmente las tres membresías del sitio (Caminante, Buscador, Guía Personal) y sus características asociadas.
  - Se agregaron las tablas de precios en pesos chilenos (CLP) mensuales y anuales.
  - Se actualizaron las referencias de pagos migrando la pasarela comercial de Stripe a **Mercado Pago**.
  - Incorporación de consentimiento de newsletter y canal de soporte oficial (`contacto@taroterapeutico.net`).
- **Actualización y Rediseño de la Política de Privacidad (`src/pages/privacy.astro`):**
  - Alineación completa al esquema visual y espaciado de la página de términos.
  - Se detalló que la fecha y hora de nacimiento recolectadas en el perfil se utilizan con la finalidad explícita de calcular y desplegar el Arcano Personal del usuario.
  - Se especificó de forma detallada que el historial de tiradas se almacena para que el usuario pueda visualizar, comparar y hacer un seguimiento evolutivo de sus lecturas de acuerdo a las preguntas realizadas a lo largo del tiempo.
  - Actualización de referencias comerciales a **Mercado Pago** como proveedor de facturación.
- **Rediseño de Membresías en Perfil (`src/pages/profile.astro`, `src/lib/plans.ts` y `src/types/auth.ts`):**
  - Se adaptó el perfil del usuario para mostrar claramente los tres niveles de membresía: *Caminante* (gratuito), *Buscador* (intermedio) y *Guía Personal* (premium), incluyendo sus precios en pesos chilenos y lista de características/límites de tiradas.
  - Se definieron nuevos tipos de plan (`buscador_monthly`, `buscador_annual`, `guia_monthly`, `guia_annual`) manteniendo retrocompatibilidad automática con los usuarios que tenían suscripciones anteriores.
  - Se ajustaron los límites dinámicos de guardado de tiradas (3 para Caminante, 10 para Buscador y Guía Personal).
- **Optimización de Carga de Imágenes (`Navbar.astro`, `profile.astro` y `astro.config.mjs`):**
  - Se autorizó el dominio de Cloudinary (`res.cloudinary.com`) en la configuración de Astro para procesar imágenes remotas dinámicamente.
  - Se reemplazó la etiqueta HTML `<img>` de la carta de Arcano Personal en el perfil por el componente oficial `<Image />` de Astro configurado con precarga activa (`loading="eager"`) y tamaño explícito, mejorando los tiempos del Largest Contentful Paint (LCP).
  - Se actualizó el fallback de la carta de Arcano Personal de `/placeholder-card.jpg` (inexistente) a `/cardback.jpg` (existente en el proyecto).
  - Se agregó precarga activa (`loading="eager"`) al logotipo de la cabecera (`Navbar.astro`) al ubicarse por encima de la línea de pliegue de la página (above the fold).
