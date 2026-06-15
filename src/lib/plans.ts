import type { UserPlan } from '../types/auth';

export const FREE_READING_LIMIT = 10;

export function isPremiumPlan(plan: UserPlan): boolean {
  return plan === 'premium_monthly' || plan === 'premium_annual';
}

export function getPlanLabel(plan: UserPlan): string {
  switch (plan) {
    case 'premium_monthly':
      return 'Premium mensual';
    case 'premium_annual':
      return 'Premium anual';
    default:
      return 'Gratis';
  }
}

export function canSaveReading(plan: UserPlan, readingCount: number): boolean {
  if (isPremiumPlan(plan)) return true;
  return readingCount < FREE_READING_LIMIT;
}
