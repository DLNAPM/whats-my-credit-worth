
import type { User } from 'firebase/auth';

export type View = 'dashboard' | 'reports' | 'privacy' | 'admin';

export type PayFrequency = 'weekly' | 'bi-weekly' | 'twice-a-month' | 'monthly' | 'yearly';

export interface IncomeSource {
  id: string;
  name: string;
  amount: number;
  frequency: PayFrequency;
}

export interface NamedAmount {
  id: string;
  name: string;
  amount: number;
}

export interface CreditCard {
  id: string;
  name: string;
  balance: number;
  limit: number;
}

export interface Loan {
  id: string;
  name: string;
  balance: number;
  limit: number;
}

export interface Asset {
  id: string;
  name: string;
  value: number;
}

export interface MonthlyData {
  income: {
    jobs: IncomeSource[];
  };
  creditScores: {
    experian: { score8: number };
    equifax: { score8: number };
    transunion: { score8: number };
    lendingTree: number;
    creditKarma: number;
    creditSesame: number;
    mrCooper: number;
    mrCooperLabel?: string;
    creditCardFico8?: number;
    autoFico8?: number;
  };
  creditCards: CreditCard[];
  loans: Loan[];
  assets: Asset[];
  monthlyBills: NamedAmount[];
}

export interface FinancialData {
  [monthYear: string]: MonthlyData;
}

export interface RecommendationItem {
  title: string;
  description: string;
  category: 'Debt Reduction' | 'Investment' | 'Life Insurance & Protection' | 'Strategic Move';
  actionItem: string;
}

export type AccountType = 'personal' | 'business';

export interface AppUser extends User {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAnonymous: boolean;
  photoURL?: string | null;
  isMock?: boolean;
  isPremium?: boolean;
  isSuperUser?: boolean;
  isFrozen?: boolean;
  savedTickers?: string[];
  showStockBanner?: boolean;
  accountType?: AccountType;
  businessName?: string;
  businessType?: string;
}

export interface SavedAdvisorRequest {
  id: string;
  userId?: string;
  title: string;
  prompt: string;
  response: string;
  createdAt: string;
}

