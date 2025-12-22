
import type { User } from 'firebase/auth';

export type View = 'dashboard' | 'reports';

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
  };
  creditCards: CreditCard[];
  loans: Loan[];
  assets: Asset[];
  monthlyBills: NamedAmount[];
}

export interface FinancialData {
  [monthYear: string]: MonthlyData;
}

export type AppUser = User;
