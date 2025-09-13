# Tarot de Marsella — Astro

Sitio en Astro para explorar el Tarot de Marsella: cartas, descripciones y tiradas aleatorias.

## Estructura

```
public/
src/
	components/
	layouts/
	pages/
	styles/
```

## Scripts

- `npm run dev`: arranca el servidor de desarrollo en http://localhost:4321
- `npm run build`: genera la build de producción en `dist/`
- `npm run preview`: sirve la build generada

## Configuración

- TailwindCSS y PostCSS ya están configurados.
- Sitemap automático con `@astrojs/sitemap`. Define `SITE_URL` en producción para URLs canónicas correctas.
- `robots.txt` incluido en `public/`.

Variables públicas esperadas para Firebase (por ejemplo, en `.env`):

```
PUBLIC_FIREBASE_API_KEY=...
PUBLIC_FIREBASE_AUTH_DOMAIN=...
PUBLIC_FIREBASE_PROJECT_ID=...
PUBLIC_FIREBASE_STORAGE_BUCKET=...
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
PUBLIC_FIREBASE_APP_ID=...
SITE_URL=https://tusitio.com
```

## Notas

- Meta etiquetas y Open Graph están centralizadas en `src/components/Head.astro`.
- Páginas legales básicas incluidas: `privacy`, `terms`, `cookies`.

