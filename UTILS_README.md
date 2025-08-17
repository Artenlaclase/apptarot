# Utilidades Compartidas - AppTarot

Este documento describe las utilidades compartidas creadas para eliminar la duplicación de código en el proyecto AppTarot.

## 📁 Estructura de Utilidades

```
src/utils/
├── index.ts          # Exportaciones principales
├── arrayUtils.ts     # Utilidades para arrays y algoritmos
├── cardUtils.ts      # Utilidades específicas para cartas de tarot
├── imageUtils.ts     # Procesamiento y optimización de imágenes
├── validationUtils.ts # Validación de formularios y datos
└── clientUtils.js    # Utilidades para JavaScript del cliente
```

## 🔧 Utilidades Principales

### 1. **imageUtils.ts** - Procesamiento de Imágenes

Funciones para optimizar y procesar URLs de imágenes:

```typescript
import { processImageUrl, getOptimizedCardUrl, DEFAULT_IMAGES } from '../utils';

// Procesar URL de imagen con optimización automática
const optimizedUrl = processImageUrl(originalUrl, 300); // 300px de ancho

// Obtener URL optimizada para carta específica
const cardUrl = getOptimizedCardUrl('El Loco', fallbackUrl, 300);

// Constantes de imágenes
console.log(DEFAULT_IMAGES.CARD_BACK); // '/cardback.jpg'
console.log(DEFAULT_IMAGES.PLACEHOLDER); // '/placeholder-card.jpg'
```

### 2. **cardUtils.ts** - Manejo de Cartas

Funciones específicas para el manejo de cartas de tarot:

```typescript
import { 
  mapFirestoreToCard, 
  getCardIdentifier, 
  groupCardsBySuit,
  sortMajorArcanaCards,
  SUITS,
  SUIT_ORDER 
} from '../utils';

// Convertir datos de Firestore a objeto tipado
const card = mapFirestoreToCard(docId, docData);

// Obtener identificador de carta (número o valor)
const identifier = getCardIdentifier(card);

// Agrupar cartas menores por palo
const cardsBySuit = groupCardsBySuit(minorCards);

// Ordenar arcanos mayores por número
const sortedMajors = sortMajorArcanaCards(majorCards);

// Información de palos
console.log(SUITS.bastos.element); // 'Fuego'
console.log(SUIT_ORDER); // ['bastos', 'copas', 'espadas', 'oros']
```

### 3. **validationUtils.ts** - Validación de Datos

Funciones para validar formularios y datos de entrada:

```typescript
import { 
  validateCardForm, 
  validateCardName, 
  validateImageUrl,
  processFormArrayField 
} from '../utils';

// Validar formulario completo
const validation = validateCardForm(formData);
if (!validation.isValid) {
  console.log(validation.errors);
}

// Validar campos individuales
const nameValidation = validateCardName('El Mago');
const urlValidation = validateImageUrl('https://example.com/image.jpg');

// Procesar arrays desde FormData
const keywords = processFormArrayField(formData.get('keywords'), 10);
```

### 4. **arrayUtils.ts** - Operaciones con Arrays

Funciones utilitarias para manipulación de arrays:

```typescript
import { 
  shuffleArray, 
  getRandomUniqueElements, 
  groupBy, 
  uniqueBy 
} from '../utils';

// Barajar un array
const shuffledCards = shuffleArray(cards);

// Obtener elementos aleatorios únicos
const randomCards = getRandomUniqueElements(cards, 5);

// Agrupar por criterio
const cardsByArcano = groupBy(cards, card => card.arcano);

// Elementos únicos por criterio
const uniqueCards = uniqueBy(cards, card => card.id);
```

## 🎯 Archivos Actualizados

### Archivos que ahora usan las utilidades:

1. **`src/pages/cards/major.astro`**
   - ✅ Usa `processImageUrl` para optimización de imágenes
   - ✅ Importa tipos desde utilidades

2. **`src/pages/cards/minor.astro`**
   - ✅ Usa `groupCardsBySuit` para agrupar cartas por palo
   - ✅ Usa `SUITS` y `SUIT_ORDER` para información de palos
   - ✅ Usa `processImageUrl` para imágenes

3. **`src/pages/cards/[id].astro`**
   - ✅ Usa `mapFirestoreToDetailedCard` para conversión de datos
   - ✅ Usa `getCardIdentifier` para identificadores
   - ✅ Usa `processImageUrl` con mayor resolución (600px)

4. **`src/pages/cards/new.astro`**
   - ✅ Usa `validateCardForm` para validación completa
   - ✅ Usa `normalizeNameToId` para crear IDs
   - ✅ Usa `processFormArrayField` para procesar arrays
   - ✅ Manejo mejorado de errores de validación

5. **`src/pages/cards/random-cards.astro`**
   - ✅ Usa constantes compartidas (`DEFAULT_IMAGES`, `SPECIAL_CARD_URLS`)
   - ✅ Usa `processImageUrl` para optimización
   - ✅ Preparado para usar utilidades de cliente

## 📊 Beneficios Obtenidos

### ✅ **Eliminación de Duplicación**
- Función `processImageUrl` eliminada de 4 archivos
- Lógica de agrupación por palos centralizada
- Validaciones consistentes en todos los formularios

### ✅ **Mejor Mantenibilidad**
- Cambios en una utilidad se propagan automáticamente
- Código más fácil de testear y debuggear
- Separación clara de responsabilidades

### ✅ **Consistencia**
- Validaciones uniformes en toda la aplicación
- Procesamiento de imágenes estandarizado
- Tipos TypeScript compartidos

### ✅ **Escalabilidad**
- Fácil agregar nuevas funcionalidades
- Reutilización en nuevos componentes
- Base sólida para futuras mejoras

## 🚀 Uso Recomendado

### Para nuevos componentes:
```typescript
// Importar solo lo que necesites
import { processImageUrl, validateCardName } from '../utils';

// O importar todo desde el index
import { processImageUrl, validateCardName } from '../utils/index.js';
```

### Para formularios:
```typescript
// Validar antes de procesar
const validation = validateCardForm(formData);
if (!validation.isValid) {
  // Manejar errores
  return { errors: validation.errors };
}
```

### Para procesamiento de imágenes:
```typescript
// Siempre usar la utilidad para consistencia
const imageUrl = processImageUrl(originalUrl, desiredWidth);
```

## 🔮 Próximos Pasos

1. **Testing**: Agregar tests unitarios para cada utilidad
2. **Documentación JSDoc**: Completar documentación inline
3. **Optimizaciones**: Añadir más optimizaciones de rendimiento
4. **Nuevas Utilidades**: Crear utilidades para SEO, analytics, etc.

## 📝 Notas de Migración

- Todas las funciones mantienen la misma API que las originales
- Los tipos TypeScript son más estrictos y seguros
- Las validaciones son más robustas
- Mejor manejo de errores incorporado

---

**Impacto del cambio**: Reducción significativa de código duplicado y mejora en la mantenibilidad del proyecto.
