export type UserPlan = 'free' | 'premium_monthly' | 'premium_annual';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  fullName?: string;
  bio?: string;
  hobbies?: string;
  socialInstagram?: string;
  socialX?: string;
  socialTiktok?: string;
  socialWebsite?: string;
  photoURL?: string;
  birthDate?: string;
  birthHour?: string;
  personalArcaneNumber?: number;
  personalArcaneName?: string;
  personalArcaneMeaning?: string;
  personalArcaneCalculatedAt?: string;
  plan: UserPlan;
  planStatus: 'active' | 'inactive' | 'past_due' | 'canceled';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionCurrentPeriodEnd?: string;
  readingCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReadingCard {
  nombre: string;
  arcano: string;
  numero?: number;
  valor?: string;
}

export interface UserReading {
  id: string;
  uid: string;
  createdAt: string;
  updatedAt: string;
  cards: ReadingCard[];
  interpretation: string;
  source: 'random-cards';
}
