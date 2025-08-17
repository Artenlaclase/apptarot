/**
 * Utilidades para operaciones con arrays y algoritmos de barajado
 */

/**
 * Baraja un array usando el algoritmo Fisher-Yates
 * @param array - Array a barajar
 * @returns Nuevo array barajado
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]; // Crear copia para no modificar el original
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

/**
 * Selecciona elementos aleatorios únicos de un array
 * @param array - Array fuente
 * @param count - Número de elementos a seleccionar
 * @returns Array con elementos seleccionados
 */
export function getRandomUniqueElements<T>(array: T[], count: number): T[] {
  if (count >= array.length) {
    return shuffleArray(array);
  }
  
  const shuffled = shuffleArray(array);
  return shuffled.slice(0, count);
}

/**
 * Divide un array en chunks de tamaño específico
 * @param array - Array a dividir
 * @param chunkSize - Tamaño de cada chunk
 * @returns Array de chunks
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  
  return chunks;
}

/**
 * Encuentra elementos únicos en un array basándose en una propiedad
 * @param array - Array fuente
 * @param keySelector - Función que selecciona la clave única
 * @returns Array con elementos únicos
 */
export function uniqueBy<T, K>(array: T[], keySelector: (item: T) => K): T[] {
  const seen = new Set<K>();
  const result: T[] = [];
  
  for (const item of array) {
    const key = keySelector(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  
  return result;
}

/**
 * Agrupa elementos de un array por una clave específica
 * @param array - Array a agrupar
 * @param keySelector - Función que selecciona la clave de agrupación
 * @returns Objeto con elementos agrupados
 */
export function groupBy<T, K extends string | number>(
  array: T[], 
  keySelector: (item: T) => K
): Record<K, T[]> {
  const groups = {} as Record<K, T[]>;
  
  for (const item of array) {
    const key = keySelector(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
  }
  
  return groups;
}

/**
 * Ordena un array por múltiples criterios
 * @param array - Array a ordenar
 * @param sortFunctions - Array de funciones de comparación
 * @returns Array ordenado
 */
export function multiSort<T>(
  array: T[], 
  sortFunctions: Array<(a: T, b: T) => number>
): T[] {
  return [...array].sort((a, b) => {
    for (const sortFn of sortFunctions) {
      const result = sortFn(a, b);
      if (result !== 0) {
        return result;
      }
    }
    return 0;
  });
}

/**
 * Encuentra la intersección entre dos arrays
 * @param array1 - Primer array
 * @param array2 - Segundo array
 * @param keySelector - Función opcional para comparar elementos complejos
 * @returns Array con elementos en común
 */
export function intersection<T>(
  array1: T[], 
  array2: T[], 
  keySelector?: (item: T) => any
): T[] {
  if (keySelector) {
    const set2Keys = new Set(array2.map(keySelector));
    return array1.filter(item => set2Keys.has(keySelector(item)));
  }
  
  const set2 = new Set(array2);
  return array1.filter(item => set2.has(item));
}

/**
 * Encuentra la diferencia entre dos arrays
 * @param array1 - Primer array
 * @param array2 - Segundo array
 * @param keySelector - Función opcional para comparar elementos complejos
 * @returns Array con elementos que están en array1 pero no en array2
 */
export function difference<T>(
  array1: T[], 
  array2: T[], 
  keySelector?: (item: T) => any
): T[] {
  if (keySelector) {
    const set2Keys = new Set(array2.map(keySelector));
    return array1.filter(item => !set2Keys.has(keySelector(item)));
  }
  
  const set2 = new Set(array2);
  return array1.filter(item => !set2.has(item));
}

/**
 * Obtiene un elemento aleatorio de un array
 * @param array - Array fuente
 * @returns Elemento aleatorio o undefined si el array está vacío
 */
export function getRandomElement<T>(array: T[]): T | undefined {
  if (array.length === 0) return undefined;
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Verifica si un array está vacío o es null/undefined
 * @param array - Array a verificar
 * @returns true si el array está vacío o es null/undefined
 */
export function isEmpty<T>(array: T[] | null | undefined): array is null | undefined | [] {
  return !array || array.length === 0;
}

/**
 * Elimina elementos duplicados de un array
 * @param array - Array con posibles duplicados
 * @param keySelector - Función opcional para obtener la clave de comparación
 * @returns Array sin duplicados
 */
export function removeDuplicates<T>(
  array: T[], 
  keySelector?: (item: T) => any
): T[] {
  if (keySelector) {
    return uniqueBy(array, keySelector);
  }
  
  return [...new Set(array)];
}
