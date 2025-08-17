/**
 * Utilidades compartidas para JavaScript del lado del cliente
 * Este archivo contiene funciones que pueden ser usadas en los scripts <script> de Astro
 */

/**
 * Baraja un array usando el algoritmo Fisher-Yates (versión para cliente)
 * @param {Array} array - Array a barajar
 * @returns {Array} Nuevo array barajado
 */
export function shuffleArray(array) {
  const shuffled = [...array];
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

/**
 * Selecciona elementos aleatorios únicos de un array
 * @param {Array} array - Array fuente
 * @param {number} count - Número de elementos a seleccionar
 * @returns {Array} Array con elementos seleccionados
 */
export function getRandomUniqueElements(array, count) {
  if (count >= array.length) {
    return shuffleArray(array);
  }
  
  const shuffled = shuffleArray(array);
  return shuffled.slice(0, count);
}

/**
 * Obtiene el identificador de una carta
 * @param {Object} card - Objeto carta
 * @returns {string} Identificador de la carta
 */
export function getCardIdentifier(card) {
  if (card.arcano === 'menor' && card.valor) {
    return card.valor;
  }
  return card.numero ? `${card.numero}` : '';
}

/**
 * Procesa URL de imagen para optimización (versión cliente)
 * @param {string} url - URL original
 * @param {string} cardName - Nombre de la carta para URLs especiales
 * @param {Object} specialCards - Objeto con URLs especiales
 * @param {number} width - Ancho deseado
 * @returns {string} URL procesada
 */
export function processCardImageUrl(url, cardName, specialCards, width = 300) {
  // Verificar URLs especiales primero
  if (specialCards && specialCards[cardName]) {
    return specialCards[cardName];
  }
  
  if (!url || typeof url !== 'string') {
    return '/placeholder-card.jpg';
  }
  
  const cleanedUrl = url.trim();
  
  // Firebase Storage
  if (cleanedUrl.startsWith('https://firebasestorage.googleapis.com')) {
    return cleanedUrl.includes('alt=media')
      ? cleanedUrl
      : `${cleanedUrl}${cleanedUrl.includes('?') ? '&' : '?'}alt=media`;
  }
  
  // Cloudinary
  if (cleanedUrl.includes('res.cloudinary.com') && !cleanedUrl.includes('upload/w_')) {
    return cleanedUrl.replace('upload/', `upload/w_${width},f_auto,q_auto/`);
  }
  
  return cleanedUrl;
}

/**
 * Genera el HTML para el handler de error de imagen
 * @param {string} fallbackUrl - URL de fallback
 * @returns {string} String para el atributo onerror
 */
export function getImageErrorHandler(fallbackUrl = '/placeholder-card.jpg') {
  return `this.onerror=null; this.src='${fallbackUrl}'; this.classList.add('error-image');`;
}

/**
 * Valida un número de cartas para la tirada
 * @param {number} count - Número de cartas solicitado
 * @param {number} maxCards - Máximo número de cartas disponibles
 * @returns {Object} Resultado de validación
 */
export function validateCardCount(count, maxCards) {
  const parsedCount = parseInt(count, 10);
  
  if (isNaN(parsedCount)) {
    return { isValid: false, message: 'Debe ser un número válido', value: 1 };
  }
  
  if (parsedCount < 1) {
    return { isValid: false, message: 'Mínimo 1 carta', value: 1 };
  }
  
  if (parsedCount > maxCards) {
    return { isValid: false, message: `Máximo ${maxCards} cartas disponibles`, value: maxCards };
  }
  
  if (parsedCount > 78) {
    return { isValid: false, message: 'Máximo 78 cartas', value: 78 };
  }
  
  return { isValid: true, message: '', value: parsedCount };
}

/**
 * Filtra cartas por tipo de arcano
 * @param {Array} cards - Array de cartas
 * @param {string} arcanoType - 'mayor', 'menor' o 'mixta'
 * @returns {Array} Array filtrado
 */
export function filterCardsByArcano(cards, arcanoType) {
  switch (arcanoType) {
    case 'mayores':
      return cards.filter(card => card.arcano === 'mayor');
    case 'menores':
      return cards.filter(card => card.arcano === 'menor');
    case 'mixta':
    default:
      return cards;
  }
}

/**
 * Crea un elemento de carta HTML
 * @param {Object} card - Objeto carta
 * @param {Object} options - Opciones de configuración
 * @returns {HTMLElement} Elemento DOM de la carta
 */
export function createCardElement(card, options = {}) {
  const {
    isFlippable = false,
    cardIndex = null,
    showIdentifier = true,
    specialCards = {},
    defaultImage = '/placeholder-card.jpg'
  } = options;
  
  const cardElement = document.createElement('div');
  cardElement.className = isFlippable 
    ? 'carta-random-item flippable-card' 
    : 'carta-random-item';
  
  if (isFlippable && cardIndex !== null) {
    cardElement.dataset.cardIndex = cardIndex;
  }
  
  const identifier = showIdentifier ? getCardIdentifier(card) : '';
  const arcanoLabel = card.arcano === 'mayor' ? 'Arcano Mayor' : 'Arcano Menor';
  const imageUrl = processCardImageUrl(card.imagem, card.nombre, specialCards);
  const errorHandler = getImageErrorHandler(defaultImage);
  
  const cardContent = isFlippable 
    ? createFlippableCardContent(card, options)
    : createNormalCardContent(card, { identifier, arcanoLabel, imageUrl, errorHandler });
  
  cardElement.innerHTML = cardContent;
  return cardElement;
}

/**
 * Crea contenido HTML para carta volteada
 * @param {Object} card - Objeto carta
 * @param {Object} options - Opciones
 * @returns {string} HTML de la carta
 */
function createFlippableCardContent(card, options) {
  const { defaultImage, cardBackImage = '/cardback.jpg' } = options;
  
  return `
    <div class="carta-random-container cursor-pointer transform transition-transform hover:scale-105">
      <div class="carta-random-image-wrapper">
        <img
          src="${cardBackImage}"
          alt="Carta boca abajo"
          loading="lazy"
          class="carta-random-image"
          onerror="${getImageErrorHandler(defaultImage)}"
        />
      </div>
      <div class="carta-random-info">
        <h3 class="carta-random-nombre">¿?</h3>
        <div class="text-sm text-gray-600">
          <span class="carta-random-numero">Haz clic para revelar</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Crea contenido HTML para carta normal
 * @param {Object} card - Objeto carta
 * @param {Object} details - Detalles de la carta
 * @returns {string} HTML de la carta
 */
function createNormalCardContent(card, details) {
  const { identifier, arcanoLabel, imageUrl, errorHandler } = details;
  
  return `
    <a href="/cards/${card.id}" class="carta-random-link">
      <article class="carta-random-container border-amber-300">
        <div class="carta-random-image-wrapper">
          <img
            src="${imageUrl}"
            alt="Carta ${card.nombre}"
            loading="lazy"
            class="carta-random-image"
            onerror="${errorHandler}"
          />
        </div>
        <div class="carta-random-info">
          <h3 class="carta-random-nombre">${card.nombre}</h3>
          <div class="text-sm text-gray-600">
            <span class="carta-random-numero">${identifier}</span>
            <span class="block text-xs">${arcanoLabel}</span>
          </div>
        </div>
      </article>
    </a>
  `;
}

/**
 * Maneja el evento de clic para voltear cartas
 * @param {Event} event - Evento de clic
 * @param {Array} availableCards - Cartas disponibles para voltear
 * @param {Object} options - Opciones de configuración
 */
export function handleCardFlip(event, availableCards, options = {}) {
  const cardElement = event.currentTarget;
  const cardIndex = parseInt(cardElement.dataset.cardIndex);
  
  if (isNaN(cardIndex) || cardIndex >= availableCards.length) {
    console.error('Índice de carta inválido');
    return;
  }
  
  const card = availableCards[cardIndex];
  const newCardElement = createCardElement(card, { 
    ...options, 
    isFlippable: false,
    showIdentifier: true 
  });
  
  // Reemplazar el elemento
  cardElement.replaceWith(newCardElement);
  
  // Remover la carta de las disponibles
  availableCards.splice(cardIndex, 1);
  
  // Actualizar los índices de las cartas restantes
  updateCardIndices();
}

/**
 * Actualiza los índices de las cartas volteables restantes
 */
function updateCardIndices() {
  const flippableCards = document.querySelectorAll('.flippable-card');
  flippableCards.forEach((card, index) => {
    card.dataset.cardIndex = index;
  });
}

// Hacer las funciones disponibles globalmente para scripts inline
if (typeof window !== 'undefined') {
  window.TarotUtils = {
    shuffleArray,
    getRandomUniqueElements,
    getCardIdentifier,
    processCardImageUrl,
    validateCardCount,
    filterCardsByArcano,
    createCardElement,
    handleCardFlip
  };
}
