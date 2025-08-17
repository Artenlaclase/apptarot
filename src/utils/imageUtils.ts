/**
 * Utilidades para el procesamiento y optimización de imágenes
 */

/**
 * Procesa y optimiza URLs de imágenes de diferentes proveedores
 * @param url - URL de la imagen original
 * @param width - Ancho deseado para la optimización (por defecto 300px)
 * @returns URL optimizada de la imagen
 */
export function processImageUrl(url: string | undefined | null, width: number = 300): string {
  if (!url || typeof url !== 'string') return '/placeholder-card.jpg';
  
  const cleanedUrl = url.trim();
  
  // Manejo de Firebase Storage
  if (cleanedUrl.startsWith('https://firebasestorage.googleapis.com')) {
    return cleanedUrl.includes('alt=media')
      ? cleanedUrl
      : `${cleanedUrl}${cleanedUrl.includes('?') ? '&' : '?'}alt=media`;
  }
  
  // Manejo de Cloudinary con optimización automática
  if (cleanedUrl.includes('res.cloudinary.com') && !cleanedUrl.includes('upload/w_')) {
    return cleanedUrl.replace('upload/', `upload/w_${width},f_auto,q_auto/`);
  }
  
  return cleanedUrl;
}

/**
 * URLs especiales para cartas problemáticas o destacadas
 */
export const SPECIAL_CARD_URLS = {
  'El Loco': 'https://res.cloudinary.com/die8wz4ag/image/upload/w_300,f_auto,q_auto/v1747796437/a22_mbkkkq.jpg',
  'El Mago': 'https://res.cloudinary.com/die8wz4ag/image/upload/w_300,f_auto,q_auto/v1747796434/a01_rxlbr2.jpg'
} as const;

/**
 * Imágenes por defecto del sistema
 */
export const DEFAULT_IMAGES = {
  CARD_BACK: '/cardback.jpg',
  PLACEHOLDER: '/placeholder-card.jpg',
  DEFAULT_CARD: 'https://res.cloudinary.com/die8wz4ag/image/upload/v1747796437/a22_mbkkkq.jpg'
} as const;

/**
 * Base URL de Cloudinary para el proyecto
 */
export const CLOUDINARY_BASE = 'https://res.cloudinary.com/die8wz4ag/image/upload';

/**
 * Obtiene la URL optimizada para una carta específica
 * @param cardName - Nombre de la carta
 * @param fallbackUrl - URL de fallback si no hay URL especial
 * @param width - Ancho deseado para la optimización
 * @returns URL optimizada de la carta
 */
export function getOptimizedCardUrl(
  cardName: string, 
  fallbackUrl: string | null | undefined, 
  width: number = 300
): string {
  // Verificar si existe una URL especial para esta carta
  if (cardName in SPECIAL_CARD_URLS) {
    return SPECIAL_CARD_URLS[cardName as keyof typeof SPECIAL_CARD_URLS];
  }
  
  // Procesar la URL de fallback
  return processImageUrl(fallbackUrl, width);
}

/**
 * Genera el atributo onerror para imágenes con fallback automático
 * @param fallbackUrl - URL de imagen de fallback (opcional)
 * @returns String para el atributo onerror
 */
export function getImageErrorHandler(fallbackUrl: string = DEFAULT_IMAGES.PLACEHOLDER): string {
  return `this.onerror=null; this.src='${fallbackUrl}'; this.classList.add('error-image');`;
}
