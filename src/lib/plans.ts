import type { UserPlan } from '../types/auth';

export const FREE_READING_LIMIT = 3;
export const PREMIUM_READING_LIMIT = 10;

export function isPremiumPlan(plan: UserPlan): boolean {
  return plan !== 'free';
}

export function getPlanLabel(plan: UserPlan): string {
  switch (plan) {
    case 'buscador_monthly':
      return 'Buscador Mensual';
    case 'buscador_annual':
      return 'Buscador Anual';
    case 'guia_monthly':
      return 'Guía Personal Mensual (Premium)';
    case 'guia_annual':
      return 'Guía Personal Anual (Premium)';
    case 'premium_monthly':
      return 'Buscador Mensual (Anterior)';
    case 'premium_annual':
      return 'Buscador Anual (Anterior)';
    default:
      return 'Caminante';
  }
}

export function getReadingLimit(plan: UserPlan): number {
  if (plan === 'free') return FREE_READING_LIMIT;
  return PREMIUM_READING_LIMIT;
}

export function canSaveReading(plan: UserPlan, readingCount: number): boolean {
  return readingCount < getReadingLimit(plan);
}
