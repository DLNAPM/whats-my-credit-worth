
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
  url?: string;
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

export interface TermLifeInsurance {
  id: string;
  policyName: string; // e.g. "Northwestern Mutual 20-Year Term", "Haven Life Level Term"
  insuranceCompany: string; // Carrier name e.g. "Prudential", "Pacific Life", "Banner Life", "Lincoln Financial"
  coverageAmount: number; // Death benefit e.g. 1000000
  premiumAmount: number; // Periodic payment cost e.g. 65
  premiumFrequency: 'monthly' | 'quarterly' | 'semi-annually' | 'annually'; // Payment cycle
  termLengthYears: number; // e.g. 10, 15, 20, 25, 30
  policyStartDate?: string; // e.g. "2020-05-15"
  policyEndDate?: string; // Expiration / conversion end date e.g. "2040-05-15"
  insuredPerson?: string; // "Self", "Spouse", or custom name
  beneficiary?: string; // Primary beneficiary name e.g. "Jane Doe (Spouse)", "Family Trust"
  contingentBeneficiary?: string; // Secondary beneficiary e.g. "Children / Minor Trust"
  policyNumber?: string; // Policy identifier e.g. "TL-9482104"
  last4?: string; // Quick last 4 identifier e.g. "2104"
  status?: 'active' | 'pending' | 'lapsed' | 'converted'; // Status of coverage
  isBusiness?: boolean; // Key-person insurance or business continuation / buy-sell agreement
  conversionOption?: boolean; // Option to convert to permanent whole/universal life without medical exam
  riders?: string[]; // e.g. "Waiver of Premium", "Accelerated Death Benefit / Terminal Illness", "Child Rider"
  url?: string; // Carrier portal or payment login link
  notes?: string; // Additional policy details, underwriting class (e.g. Preferred Plus)
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
  termLifeInsurance?: TermLifeInsurance[];
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

export type LinkedAccountRole = 'spouse' | 'business' | 'partner' | 'secondary';
export type LinkedAccountStatus = 'active' | 'pending' | 'invited';

export interface LinkedAccountConnection {
  id: string;
  targetEmail: string;              // e.g. "spouse@gmail.com" or "business@gmail.com"
  targetName?: string;              // e.g. "Sarah (Spouse)" or "Apex Holdings LLC"
  role: LinkedAccountRole;          // 'spouse' | 'business' | 'partner' | 'secondary'
  status: LinkedAccountStatus;      // 'active' | 'pending' | 'invited'
  linkedAt: string;
  notes?: string;
  allowTwoWaySync?: boolean;
  lastSyncedAt?: string;
  financialData?: FinancialData;
}

export interface MergeOptions {
  sourceId: string;
  sourceRole: LinkedAccountRole;
  sourceEmail: string;
  targetDestination: 'personal' | 'business'; // add to user's personal or business account
  selectedMonth: string; // specific month (e.g. '2026-10') or 'all'
  categories: {
    creditCards: boolean;
    loans: boolean;
    assets: boolean;
    monthlyBills: boolean;
    income: boolean;
    insurance?: boolean;
  };
  prefixTag: boolean;
  customTag?: string;
  duplicateResolution: 'keep_both' | 'merge_sum' | 'skip';
}

export interface MergeHistoryLog {
  id: string;
  mergedAt: string;
  sourceEmail: string;
  sourceRole: LinkedAccountRole;
  targetDestination: 'personal' | 'business';
  monthYear: string;
  summary: {
    cardsAdded: number;
    loansAdded: number;
    assetsAdded: number;
    billsAdded: number;
    jobsAdded: number;
    policiesAdded?: number;
  };
}

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

