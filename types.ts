
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
  accountNumber?: string;
  last4?: string;
  lenderName?: string;
  apr?: string | number;
  isBusiness?: boolean;
  url?: string;
  notes?: string;
}

export interface Loan {
  id: string;
  name: string;
  balance: number;
  limit: number;
  accountNumber?: string;
  last4?: string;
  lenderName?: string;
  apr?: string | number;
  isBusiness?: boolean;
  category?: 'loan' | 'mortgage' | 'credit-card' | 'llc' | 'other';
  url?: string;
  notes?: string;
}

export interface NextStepsAccount {
  name: string;
  lenderName: string;
  category: 'credit-card' | 'mortgage' | 'loan' | 'llc' | 'asset' | 'other' | string;
  currentBalance: string;
  creditLimit: string;
  accountNumber: string;
  apr: string;
  isBusiness: boolean;
  url: string;
  notes: string;
  accountType?: 'liability' | 'asset' | 'debt';
  assetType?: string;
  info?: string;
  balanceNumeric?: number;
}

export interface NextStepsSyncPayload {
  app: 'WhatsMyCreditWorth';
  version: '2.0';
  exportedAt: string;
  accounts: NextStepsAccount[];
  assetAccounts?: NextStepsAccount[];
  assets?: NextStepsAccount[];
  summary?: {
    totalDebts: string;
    totalAssets: string;
    netWorth: string;
    totalAccounts: number;
    totalCards: number;
    totalLoans: number;
    totalAssetsCount: number;
  };
}

export interface Asset {
  id: string;
  name: string;
  value: number;
  institution?: string;
  accountNumber?: string;
  last4?: string;
  category?: string;
  isBusiness?: boolean;
  notes?: string;
  info?: string;
  url?: string;
  apy?: string | number;
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

export type IncidentCategory = 'api_restriction' | 'billing' | 'integration' | 'system';
export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';
export type IncidentStatus = 'open' | 'acknowledged' | 'resolved';

export interface SystemIncident {
  id: string;
  title: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  status: IncidentStatus;
  message: string;
  errorDetails?: string;
  source: string;
  userEmail?: string;
  userId?: string;
  occurredAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  emailSent: boolean;
  emailRecipient: string;
  actionTaken?: string;
  occurrenceCount?: number;
}

