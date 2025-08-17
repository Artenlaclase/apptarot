/**
 * Utilidades para la validación de formularios y datos
 */

/**
 * Configuración de límites para validaciones
 */
export const VALIDATION_LIMITS = {
  MAX_KEYWORDS: 10,
  MAX_SYMBOLS: 15,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 50,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_URL_LENGTH: 2000
} as const;

/**
 * Patrones de validación
 */
export const VALIDATION_PATTERNS = {
  URL: /^https?:\/\/.+/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  CARD_NAME: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s0-9]+$/
} as const;

/**
 * Tipo para resultados de validación
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Valida un nombre de carta
 * @param name - Nombre a validar
 * @returns Resultado de validación
 */
export function validateCardName(name: string): ValidationResult {
  const errors: string[] = [];
  
  if (!name || typeof name !== 'string') {
    errors.push('El nombre es requerido');
    return { isValid: false, errors };
  }
  
  const trimmedName = name.trim();
  
  if (trimmedName.length < VALIDATION_LIMITS.MIN_NAME_LENGTH) {
    errors.push(`El nombre debe tener al menos ${VALIDATION_LIMITS.MIN_NAME_LENGTH} caracteres`);
  }
  
  if (trimmedName.length > VALIDATION_LIMITS.MAX_NAME_LENGTH) {
    errors.push(`El nombre no puede exceder ${VALIDATION_LIMITS.MAX_NAME_LENGTH} caracteres`);
  }
  
  if (!VALIDATION_PATTERNS.CARD_NAME.test(trimmedName)) {
    errors.push('El nombre contiene caracteres no válidos');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida una URL de imagen
 * @param url - URL a validar
 * @param required - Si la URL es requerida
 * @returns Resultado de validación
 */
export function validateImageUrl(url: string, required: boolean = false): ValidationResult {
  const errors: string[] = [];
  
  if (!url || typeof url !== 'string') {
    if (required) {
      errors.push('La URL de imagen es requerida');
    }
    return { isValid: !required, errors };
  }
  
  const trimmedUrl = url.trim();
  
  if (trimmedUrl.length > VALIDATION_LIMITS.MAX_URL_LENGTH) {
    errors.push(`La URL no puede exceder ${VALIDATION_LIMITS.MAX_URL_LENGTH} caracteres`);
  }
  
  if (!VALIDATION_PATTERNS.URL.test(trimmedUrl)) {
    errors.push('La URL debe comenzar con http:// o https://');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida un array de keywords
 * @param keywords - Array de keywords o string separado por comas
 * @returns Resultado de validación
 */
export function validateKeywords(keywords: string[] | string): ValidationResult {
  const errors: string[] = [];
  
  let keywordArray: string[];
  
  if (typeof keywords === 'string') {
    keywordArray = keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
  } else if (Array.isArray(keywords)) {
    keywordArray = keywords.filter(k => typeof k === 'string' && k.trim().length > 0);
  } else {
    return { isValid: true, errors: [] }; // Keywords opcionales
  }
  
  if (keywordArray.length > VALIDATION_LIMITS.MAX_KEYWORDS) {
    errors.push(`Máximo ${VALIDATION_LIMITS.MAX_KEYWORDS} keywords permitidas`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida un array de símbolos principales
 * @param symbols - Array de símbolos o string separado por comas
 * @returns Resultado de validación
 */
export function validateSymbols(symbols: string[] | string): ValidationResult {
  const errors: string[] = [];
  
  let symbolArray: string[];
  
  if (typeof symbols === 'string') {
    symbolArray = symbols.split(',').map(s => s.trim()).filter(s => s.length > 0);
  } else if (Array.isArray(symbols)) {
    symbolArray = symbols.filter(s => typeof s === 'string' && s.trim().length > 0);
  } else {
    return { isValid: true, errors: [] }; // Símbolos opcionales
  }
  
  if (symbolArray.length > VALIDATION_LIMITS.MAX_SYMBOLS) {
    errors.push(`Máximo ${VALIDATION_LIMITS.MAX_SYMBOLS} símbolos permitidos`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida un número de carta (para arcanos mayores)
 * @param numero - Número a validar
 * @returns Resultado de validación
 */
export function validateCardNumber(numero: string | number): ValidationResult {
  const errors: string[] = [];
  
  if (numero === null || numero === undefined) {
    return { isValid: true, errors: [] }; // Número opcional
  }
  
  const num = typeof numero === 'string' ? parseInt(numero, 10) : numero;
  
  if (isNaN(num)) {
    errors.push('El número debe ser un valor numérico válido');
  } else if (num < 0 || num > 22) {
    errors.push('El número debe estar entre 0 y 22');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida un texto de descripción
 * @param text - Texto a validar
 * @param required - Si el texto es requerido
 * @returns Resultado de validación
 */
export function validateDescription(text: string, required: boolean = false): ValidationResult {
  const errors: string[] = [];
  
  if (!text || typeof text !== 'string') {
    if (required) {
      errors.push('La descripción es requerida');
    }
    return { isValid: !required, errors };
  }
  
  const trimmedText = text.trim();
  
  if (required && trimmedText.length === 0) {
    errors.push('La descripción no puede estar vacía');
  }
  
  if (trimmedText.length > VALIDATION_LIMITS.MAX_DESCRIPTION_LENGTH) {
    errors.push(`La descripción no puede exceder ${VALIDATION_LIMITS.MAX_DESCRIPTION_LENGTH} caracteres`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida todos los campos de una carta
 * @param formData - Datos del formulario
 * @returns Resultado de validación consolidado
 */
export function validateCardForm(formData: FormData): ValidationResult {
  const allErrors: string[] = [];
  
  // Validar nombre
  const nameValidation = validateCardName(formData.get('nombre')?.toString() || '');
  allErrors.push(...nameValidation.errors);
  
  // Validar URL de imagen
  const imageValidation = validateImageUrl(formData.get('imagem')?.toString() || '', false);
  allErrors.push(...imageValidation.errors);
  
  // Validar número (si es arcano mayor)
  const arcano = formData.get('arcano')?.toString();
  if (arcano === 'mayor') {
    const numeroValidation = validateCardNumber(formData.get('numero')?.toString() || '');
    allErrors.push(...numeroValidation.errors);
  }
  
  // Validar significados
  const significadoDirecto = validateDescription(formData.get('significado_directo')?.toString() || '', true);
  const significadoInvertido = validateDescription(formData.get('significado_invertido')?.toString() || '', true);
  allErrors.push(...significadoDirecto.errors);
  allErrors.push(...significadoInvertido.errors);
  
  // Validar símbolos
  const symbolsValidation = validateSymbols(formData.get('simbolos_principales')?.toString() || '');
  allErrors.push(...symbolsValidation.errors);
  
  // Validar keywords
  const keywordsValidation = validateKeywords(formData.get('keywords')?.toString() || '');
  allErrors.push(...keywordsValidation.errors);
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
}

/**
 * Sanitiza un string para prevenir XSS básico
 * @param input - String a sanitizar
 * @returns String sanitizado
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Procesa un array desde FormData (string separado por comas)
 * @param value - Valor del FormData
 * @param maxItems - Número máximo de elementos
 * @returns Array procesado
 */
export function processFormArrayField(value: string | null, maxItems: number = 10): string[] {
  if (!value) return [];
  
  return value
    .split(',')
    .map(item => item.trim())
    .filter(item => item.length > 0)
    .slice(0, maxItems); // Limitar número de elementos
}
