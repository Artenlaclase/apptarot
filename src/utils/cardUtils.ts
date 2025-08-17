/**
 * Utilidades para el manejo y procesamiento de cartas de tarot
 */

import type { DocumentData } from 'firebase/firestore';

/**
 * Interfaces para las cartas de tarot
 */
export interface BaseCard {
  id: string;
  nombre: string;
  arcano: 'mayor' | 'menor';
  imagem: string;
  imagen?: string;
}

export interface MajorArcanaCard extends BaseCard {
  arcano: 'mayor';
  numero: number | string;
}

export interface MinorArcanaCard extends BaseCard {
  arcano: 'menor';
  palo: string;
  valor: string;
}

export interface DetailedCard extends BaseCard {
  numero?: number | string;
  valor?: string;
  palo?: string;
  significado: {
    directo: string;
    invertido: string;
  };
  simbolos: {
    principales: string[];
    interpretacion: string;
  };
  keywords?: string[];
}

export type Card = MajorArcanaCard | MinorArcanaCard;

/**
 * Orden correcto de los valores en los arcanos menores
 */
export const MINOR_ARCANA_ORDER = [
  'as', '2', '3', '4', '5', '6', '7', '8', '9', '10', 
  'sota', 'caballo', 'reina', 'rey'
] as const;

/**
 * Palos de los arcanos menores con sus elementos asociados
 */
export const SUITS = {
  bastos: { element: 'Fuego', emoji: '🔥', color: 'red' },
  copas: { element: 'Agua', emoji: '💧', color: 'blue' },
  espadas: { element: 'Aire', emoji: '💨', color: 'gray' },
  oros: { element: 'Tierra', emoji: '🌍', color: 'yellow' }
} as const;

/**
 * Orden preferido para mostrar los palos
 */
export const SUIT_ORDER = ['bastos', 'copas', 'espadas', 'oros'] as const;

/**
 * Obtiene el índice de orden para un valor de arcano menor
 * @param valor - Valor de la carta (as, 2-10, sota, etc.)
 * @returns Índice numérico para ordenamiento
 */
export function getMinorArcanaOrderIndex(valor: string): number {
  const normalizedValor = valor.toLowerCase().trim();
  const index = MINOR_ARCANA_ORDER.indexOf(normalizedValor as any);
  return index === -1 ? 999 : index; // Si no encuentra el valor, lo pone al final
}

/**
 * Obtiene el identificador visual de una carta
 * @param card - Objeto carta
 * @returns String con el identificador (número para mayores, valor para menores)
 */
export function getCardIdentifier(card: Card | DetailedCard): string {
  if (card.arcano === 'menor' && 'valor' in card && card.valor) {
    return card.valor;
  }
  if ('numero' in card && card.numero) {
    return typeof card.numero === 'number' ? card.numero.toString() : card.numero;
  }
  return '';
}

/**
 * Convierte datos de Firestore a objeto Card tipado
 * @param docId - ID del documento
 * @param docData - Datos del documento de Firestore
 * @returns Objeto Card tipado
 */
export function mapFirestoreToCard(docId: string, docData: DocumentData): Card {
  const baseCard: BaseCard = {
    id: docId,
    nombre: docData.nombre || 'Sin nombre',
    arcano: docData.arcano || 'mayor',
    imagem: docData.imagem || docData.imagen || '/placeholder-card.jpg'
  };

  if (docData.arcano === 'menor') {
    return {
      ...baseCard,
      arcano: 'menor',
      palo: docData.palo || 'Sin palo',
      valor: docData.valor || 'N/A'
    } as MinorArcanaCard;
  }

  return {
    ...baseCard,
    arcano: 'mayor',
    numero: docData.numero ?? 'N/A'
  } as MajorArcanaCard;
}

/**
 * Convierte datos de Firestore a objeto DetailedCard
 * @param docId - ID del documento
 * @param docData - Datos del documento de Firestore
 * @returns Objeto DetailedCard tipado
 */
export function mapFirestoreToDetailedCard(docId: string, docData: DocumentData): DetailedCard {
  return {
    id: docId,
    nombre: docData.nombre || 'Sin nombre',
    numero: docData.numero,
    valor: docData.valor,
    palo: docData.palo,
    arcano: docData.arcano || 'mayor',
    imagem: docData.imagem || docData.imagen || '/placeholder-card.jpg',
    significado: {
      directo: docData.significado?.directo || '',
      invertido: docData.significado?.invertido || ''
    },
    simbolos: {
      principales: docData.simbolos?.principales || [],
      interpretacion: docData.simbolos?.interpretacion || ''
    },
    keywords: docData.keywords || []
  };
}

/**
 * Agrupa cartas por palo (solo para arcanos menores)
 * @param cards - Array de cartas
 * @returns Objeto con cartas agrupadas por palo
 */
export function groupCardsBySuit(cards: MinorArcanaCard[]): Record<string, MinorArcanaCard[]> {
  const grouped = cards.reduce((acc, card) => {
    if (!acc[card.palo]) {
      acc[card.palo] = [];
    }
    acc[card.palo].push(card);
    return acc;
  }, {} as Record<string, MinorArcanaCard[]>);

  // Ordenar las cartas dentro de cada palo
  Object.keys(grouped).forEach(suit => {
    grouped[suit].sort((a, b) => {
      const orderA = getMinorArcanaOrderIndex(a.valor);
      const orderB = getMinorArcanaOrderIndex(b.valor);
      return orderA - orderB;
    });
  });

  return grouped;
}

/**
 * Ordena cartas de arcanos mayores por número
 * @param cards - Array de cartas de arcanos mayores
 * @returns Array ordenado por número
 */
export function sortMajorArcanaCards(cards: MajorArcanaCard[]): MajorArcanaCard[] {
  return cards.sort((a, b) => {
    const getNumericValue = (value: string | number): number => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    };
    
    const numA = getNumericValue(a.numero);
    const numB = getNumericValue(b.numero);
    return numA - numB;
  });
}

/**
 * Filtra cartas por tipo de arcano
 * @param cards - Array de cartas
 * @param arcanoType - Tipo de arcano ('mayor' o 'menor')
 * @returns Array filtrado
 */
export function filterCardsByArcana<T extends Card>(
  cards: T[], 
  arcanoType: 'mayor' | 'menor'
): T[] {
  return cards.filter(card => card.arcano === arcanoType);
}

/**
 * Normaliza un nombre para crear un ID válido
 * @param name - Nombre a normalizar
 * @returns ID normalizado
 */
export function normalizeNameToId(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Elimina acentos
}
