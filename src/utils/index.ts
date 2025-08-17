/**
 * Archivo principal de utilidades que exporta todas las funciones compartidas
 * Punto de entrada único para importar utilidades en el proyecto
 */

// Exportar todas las utilidades de imágenes
export * from './imageUtils.js';

// Exportar todas las utilidades de cartas
export * from './cardUtils.js';

// Exportar todas las utilidades de validación
export * from './validationUtils.js';

// Exportar todas las utilidades de arrays
export * from './arrayUtils.js';

// Re-exportaciones con nombres más específicos para evitar conflictos
export {
  processImageUrl as optimizeImageUrl,
  getOptimizedCardUrl as getCardImageUrl,
  DEFAULT_IMAGES as IMAGE_CONSTANTS
} from './imageUtils.js';

export {
  mapFirestoreToCard as convertFirestoreCard,
  mapFirestoreToDetailedCard as convertDetailedFirestoreCard,
  normalizeNameToId as createCardId
} from './cardUtils.js';

export {
  validateCardForm as validateCompleteCard,
  processFormArrayField as parseFormArray
} from './validationUtils.js';

export {
  shuffleArray as randomizeArray,
  getRandomUniqueElements as pickRandomCards
} from './arrayUtils.js';
