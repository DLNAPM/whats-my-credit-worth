import type { MonthlyData, FinancialData, LinkedAccountConnection, MergeOptions, CreditCard, Loan, Asset, NamedAmount, IncomeSource } from '../types';
import { getCurrentMonthYear, getPreviousMonthYear } from './helpers';

const STORAGE_KEY_PREFIX = 'wmcw_linked_accounts_';
const MERGE_HISTORY_KEY_PREFIX = 'wmcw_merge_history_';

/**
 * Generates sample financial data for a Spouse's Account (Sarah)
 */
export function getSpouseSampleData(): FinancialData {
  const currentMonth = getCurrentMonthYear();
  const m1 = currentMonth;
  const m2 = getPreviousMonthYear(m1);
  const m3 = getPreviousMonthYear(m2);

  const createSpouseMonth = (offset: number): MonthlyData => ({
    income: {
      jobs: [
        { id: crypto.randomUUID(), name: "Senior Tech Director (Sarah)", amount: 9200 + (offset * 300), frequency: 'monthly' }
      ]
    },
    creditScores: {
      experian: { score8: 760 + (offset * 5) },
      equifax: { score8: 755 + (offset * 6) },
      transunion: { score8: 765 + (offset * 4) },
      lendingTree: 770,
      creditKarma: 765,
      creditSesame: 762,
      mrCooper: 775,
      mrCooperLabel: 'FICO 4 (Spouse)',
      creditCardFico8: 780,
      autoFico8: 770
    },
    creditCards: [
      {
        id: crypto.randomUUID(),
        name: 'Chase Freedom Unlimited',
        balance: Math.max(0, 1200 - (offset * 300)),
        limit: 18000,
        accountNumber: '8821',
        last4: '8821',
        lenderName: 'Chase',
        apr: '18.24',
        url: 'https://www.chase.com'
      },
      {
        id: crypto.randomUUID(),
        name: 'Capital One Venture X',
        balance: Math.max(0, 2100 - (offset * 400)),
        limit: 30000,
        accountNumber: '4410',
        last4: '4410',
        lenderName: 'Capital One',
        apr: '19.99',
        url: 'https://www.capitalone.com'
      }
    ],
    loans: [
      {
        id: crypto.randomUUID(),
        name: 'Student Loan Consolidation',
        balance: Math.max(0, 24000 - (offset * 450)),
        limit: 45000,
        accountNumber: '9012',
        last4: '9012',
        lenderName: 'Nelnet',
        apr: '4.50',
        category: 'loan',
        url: 'https://www.nelnet.com'
      }
    ],
    assets: [
      {
        id: crypto.randomUUID(),
        name: 'Vanguard Total Stock ETF (VTI)',
        value: 145000 + (offset * 4500),
        institution: 'Vanguard',
        category: 'Investment / Brokerage',
        accountNumber: '3109',
        last4: '3109',
        url: 'https://www.vanguard.com'
      },
      {
        id: crypto.randomUUID(),
        name: 'Ally High Yield Savings',
        value: 28000 + (offset * 1200),
        institution: 'Ally Bank',
        category: 'Savings / HYSA',
        accountNumber: '5582',
        last4: '5582',
        url: 'https://www.ally.com'
      }
    ],
    monthlyBills: [
      { id: crypto.randomUUID(), name: 'Student Loan Minimum', amount: 320, url: 'https://www.nelnet.com' },
      { id: crypto.randomUUID(), name: 'Cellular Plan (Family)', amount: 110, url: 'https://www.verizon.com' }
    ]
  });

  return {
    [m3]: createSpouseMonth(0),
    [m2]: createSpouseMonth(1),
    [m1]: createSpouseMonth(2)
  };
}

/**
 * Generates sample financial data for a Business Account (Apex Solutions LLC)
 */
export function getBusinessSampleData(): FinancialData {
  const currentMonth = getCurrentMonthYear();
  const m1 = currentMonth;
  const m2 = getPreviousMonthYear(m1);
  const m3 = getPreviousMonthYear(m2);

  const createBusinessMonth = (offset: number): MonthlyData => ({
    income: {
      jobs: [
        { id: crypto.randomUUID(), name: 'Client Retainers (Apex LLC)', amount: 14500 + (offset * 800), frequency: 'monthly' }
      ]
    },
    creditScores: {
      experian: { score8: 780 + (offset * 4) },
      equifax: { score8: 775 + (offset * 5) },
      transunion: { score8: 785 + (offset * 3) },
      lendingTree: 790,
      creditKarma: 780,
      creditSesame: 778,
      mrCooper: 800,
      mrCooperLabel: 'Commercial Paydex (80)',
      creditCardFico8: 790,
      autoFico8: 780
    },
    creditCards: [
      {
        id: crypto.randomUUID(),
        name: 'Chase Ink Business Cash',
        balance: Math.max(0, 3800 - (offset * 600)),
        limit: 25000,
        accountNumber: '6291',
        last4: '6291',
        lenderName: 'Chase Commercial',
        apr: '17.49',
        isBusiness: true,
        url: 'https://www.chase.com/business'
      },
      {
        id: crypto.randomUUID(),
        name: 'Amex Business Gold',
        balance: Math.max(0, 4500 - (offset * 500)),
        limit: 50000,
        accountNumber: '1094',
        last4: '1094',
        lenderName: 'American Express Business',
        apr: '18.99',
        isBusiness: true,
        url: 'https://www.americanexpress.com/business'
      }
    ],
    loans: [
      {
        id: crypto.randomUUID(),
        name: 'SBA 7(a) Working Capital Loan',
        balance: Math.max(0, 68000 - (offset * 1200)),
        limit: 100000,
        accountNumber: '7433',
        last4: '7433',
        lenderName: 'Live Oak SBA',
        apr: '7.25',
        category: 'llc',
        isBusiness: true,
        url: 'https://www.sba.gov'
      },
      {
        id: crypto.randomUUID(),
        name: 'Commercial Van Fleet Lease',
        balance: Math.max(0, 14200 - (offset * 400)),
        limit: 32000,
        accountNumber: '3190',
        last4: '3190',
        lenderName: 'Ford Commercial Credit',
        apr: '5.90',
        category: 'loan',
        isBusiness: true,
        url: 'https://www.ford.com/finance/commercial'
      }
    ],
    assets: [
      {
        id: crypto.randomUUID(),
        name: 'Mercury Commercial Operating Checking',
        value: 95000 + (offset * 5000),
        institution: 'Mercury',
        category: 'Checking / Cash',
        accountNumber: '8839',
        last4: '8839',
        isBusiness: true,
        url: 'https://www.mercury.com'
      },
      {
        id: crypto.randomUUID(),
        name: 'Brex Treasury High-Yield Cash',
        value: 160000 + (offset * 7500),
        institution: 'Brex Treasury',
        category: 'Savings / HYSA',
        accountNumber: '2941',
        last4: '2941',
        isBusiness: true,
        url: 'https://www.brex.com'
      }
    ],
    monthlyBills: [
      { id: crypto.randomUUID(), name: 'Office / Co-Working Lease', amount: 1850, url: 'https://www.wework.com' },
      { id: crypto.randomUUID(), name: 'AWS Cloud Hosting & Infra', amount: 640, url: 'https://aws.amazon.com' },
      { id: crypto.randomUUID(), name: 'Commercial Liability Insurance', amount: 290, url: 'https://www.hiscox.com' }
    ]
  });

  return {
    [m3]: createBusinessMonth(0),
    [m2]: createBusinessMonth(1),
    [m1]: createBusinessMonth(2)
  };
}

/**
 * Loads linked account connections from storage
 */
export function loadLinkedAccounts(userId?: string): LinkedAccountConnection[] {
  const key = `${STORAGE_KEY_PREFIX}${userId || 'guest'}`;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      // Seed default sample connections for rapid evaluation
      const initial: LinkedAccountConnection[] = [
        {
          id: 'conn_spouse_sample',
          targetEmail: 'spouse.sarah@gmail.com',
          targetName: 'Sarah (Spouse Account)',
          role: 'spouse',
          status: 'active',
          linkedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
          notes: 'Joint household finances, consumer cards & retirement',
          allowTwoWaySync: true,
          lastSyncedAt: new Date().toISOString(),
          financialData: getSpouseSampleData()
        },
        {
          id: 'conn_business_sample',
          targetEmail: 'finance@apexsolutions.llc',
          targetName: 'Apex Solutions LLC (Business Account)',
          role: 'business',
          status: 'active',
          linkedAt: new Date(Date.now() - 86400000 * 15).toISOString(),
          notes: 'Commercial lines of credit, SBA loan & treasury reserves',
          allowTwoWaySync: true,
          lastSyncedAt: new Date().toISOString(),
          financialData: getBusinessSampleData()
        }
      ];
      saveLinkedAccounts(initial, userId);
      return initial;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Failed to load linked accounts", err);
    return [];
  }
}

/**
 * Saves linked account connections to storage
 */
export function saveLinkedAccounts(connections: LinkedAccountConnection[], userId?: string): void {
  const key = `${STORAGE_KEY_PREFIX}${userId || 'guest'}`;
  try {
    localStorage.setItem(key, JSON.stringify(connections));
  } catch (err) {
    console.error("Failed to save linked accounts", err);
  }
}

/**
 * Merges a single month of financial data from a source into a target
 */
export function mergeMonthData(
  targetData: MonthlyData,
  sourceData: MonthlyData,
  options: MergeOptions
): {
  merged: MonthlyData;
  summary: {
    cardsAdded: number;
    loansAdded: number;
    assetsAdded: number;
    billsAdded: number;
    jobsAdded: number;
  };
} {
  const tagPrefix = options.prefixTag 
    ? (options.customTag?.trim() ? `${options.customTag.trim()} ` : options.sourceRole === 'spouse' ? '[Spouse] ' : '[Business] ')
    : '';

  const isBiz = options.targetDestination === 'business' || options.sourceRole === 'business';

  let cardsAdded = 0;
  let loansAdded = 0;
  let assetsAdded = 0;
  let billsAdded = 0;
  let jobsAdded = 0;

  // Clone target deeply
  const newMonth: MonthlyData = JSON.parse(JSON.stringify(targetData));

  // 1. Merge Credit Cards
  if (options.categories.creditCards && sourceData.creditCards) {
    const existingCards = newMonth.creditCards || [];
    sourceData.creditCards.forEach((c: CreditCard) => {
      const mergedName = `${tagPrefix}${c.name}`;
      const newCard: CreditCard = {
        ...c,
        id: crypto.randomUUID(),
        name: mergedName,
        isBusiness: isBiz ? true : (c.isBusiness || false)
      };
      existingCards.push(newCard);
      cardsAdded++;
    });
    newMonth.creditCards = existingCards;
  }

  // 2. Merge Mortgages & Loans
  if (options.categories.loans && sourceData.loans) {
    const existingLoans = newMonth.loans || [];
    sourceData.loans.forEach((l: Loan) => {
      const mergedName = `${tagPrefix}${l.name}`;
      const newLoan: Loan = {
        ...l,
        id: crypto.randomUUID(),
        name: mergedName,
        isBusiness: isBiz ? true : (l.isBusiness || false)
      };
      existingLoans.push(newLoan);
      loansAdded++;
    });
    newMonth.loans = existingLoans;
  }

  // 3. Merge Assets
  if (options.categories.assets && sourceData.assets) {
    const existingAssets = newMonth.assets || [];
    sourceData.assets.forEach((a: Asset) => {
      const mergedName = `${tagPrefix}${a.name}`;
      const newAsset: Asset = {
        ...a,
        id: crypto.randomUUID(),
        name: mergedName,
        isBusiness: isBiz ? true : (a.isBusiness || false)
      };
      existingAssets.push(newAsset);
      assetsAdded++;
    });
    newMonth.assets = existingAssets;
  }

  // 4. Merge Monthly Bills
  if (options.categories.monthlyBills && sourceData.monthlyBills) {
    const existingBills = newMonth.monthlyBills || [];
    sourceData.monthlyBills.forEach((b: NamedAmount) => {
      const mergedName = `${tagPrefix}${b.name}`;
      const newBill: NamedAmount = {
        ...b,
        id: crypto.randomUUID(),
        name: mergedName
      };
      existingBills.push(newBill);
      billsAdded++;
    });
    newMonth.monthlyBills = existingBills;
  }

  // 5. Merge Income Jobs
  if (options.categories.income && sourceData.income?.jobs) {
    const existingJobs = newMonth.income?.jobs || [];
    sourceData.income.jobs.forEach((j: IncomeSource) => {
      const mergedName = `${tagPrefix}${j.name}`;
      const newJob: IncomeSource = {
        ...j,
        id: crypto.randomUUID(),
        name: mergedName
      };
      existingJobs.push(newJob);
      jobsAdded++;
    });
    if (!newMonth.income) newMonth.income = { jobs: [] };
    newMonth.income.jobs = existingJobs;
  }

  return {
    merged: newMonth,
    summary: {
      cardsAdded,
      loansAdded,
      assetsAdded,
      billsAdded,
      jobsAdded
    }
  };
}

/**
 * Merges full dataset (either across all months or for a selected month)
 */
export function mergeFullFinancialData(
  targetFullData: FinancialData,
  sourceFullData: FinancialData,
  options: MergeOptions
): {
  resultData: FinancialData;
  summary: {
    cardsAdded: number;
    loansAdded: number;
    assetsAdded: number;
    billsAdded: number;
    jobsAdded: number;
    monthsUpdated: number;
  };
} {
  const result: FinancialData = JSON.parse(JSON.stringify(targetFullData));
  let totalCards = 0;
  let totalLoans = 0;
  let totalAssets = 0;
  let totalBills = 0;
  let totalJobs = 0;
  let monthsUpdated = 0;

  if (options.selectedMonth && options.selectedMonth !== 'all') {
    const targetMonth = result[options.selectedMonth] || sourceFullData[options.selectedMonth];
    const sourceMonth = sourceFullData[options.selectedMonth];

    if (targetMonth && sourceMonth) {
      const { merged, summary } = mergeMonthData(targetMonth, sourceMonth, options);
      result[options.selectedMonth] = merged;
      totalCards += summary.cardsAdded;
      totalLoans += summary.loansAdded;
      totalAssets += summary.assetsAdded;
      totalBills += summary.billsAdded;
      totalJobs += summary.jobsAdded;
      monthsUpdated = 1;
    }
  } else {
    // Merge across all available months in source
    const sourceMonths = Object.keys(sourceFullData);
    sourceMonths.forEach(m => {
      const sourceMonth = sourceFullData[m];
      if (sourceMonth) {
        const targetMonth = result[m] || {
          income: { jobs: [] },
          creditScores: {
            experian: { score8: 700 },
            equifax: { score8: 700 },
            transunion: { score8: 700 },
            lendingTree: 700,
            creditKarma: 700,
            creditSesame: 700,
            mrCooper: 700
          },
          creditCards: [],
          loans: [],
          assets: [],
          monthlyBills: []
        };

        const { merged, summary } = mergeMonthData(targetMonth, sourceMonth, options);
        result[m] = merged;
        totalCards += summary.cardsAdded;
        totalLoans += summary.loansAdded;
        totalAssets += summary.assetsAdded;
        totalBills += summary.billsAdded;
        totalJobs += summary.jobsAdded;
        monthsUpdated++;
      }
    });
  }

  return {
    resultData: result,
    summary: {
      cardsAdded: totalCards,
      loansAdded: totalLoans,
      assetsAdded: totalAssets,
      billsAdded: totalBills,
      jobsAdded: totalJobs,
      monthsUpdated
    }
  };
}

/**
 * Computes a live consolidated MonthlyData combining two profiles (e.g. Personal + Spouse)
 * without altering persistent state.
 */
export function calculateConsolidatedMonthlyData(
  primaryData?: MonthlyData,
  secondaryData?: MonthlyData,
  labelB: string = 'Spouse'
): MonthlyData | null {
  if (!primaryData && !secondaryData) return null;
  if (!secondaryData) return primaryData || null;
  if (!primaryData) return secondaryData;

  const combined: MonthlyData = {
    income: {
      jobs: [
        ...(primaryData.income?.jobs || []),
        ...(secondaryData.income?.jobs || []).map(j => ({ ...j, id: `cons_${j.id}`, name: `[${labelB}] ${j.name}` }))
      ]
    },
    creditScores: {
      experian: {
        score8: Math.round(((primaryData.creditScores?.experian?.score8 || 700) + (secondaryData.creditScores?.experian?.score8 || 700)) / 2)
      },
      equifax: {
        score8: Math.round(((primaryData.creditScores?.equifax?.score8 || 700) + (secondaryData.creditScores?.equifax?.score8 || 700)) / 2)
      },
      transunion: {
        score8: Math.round(((primaryData.creditScores?.transunion?.score8 || 700) + (secondaryData.creditScores?.transunion?.score8 || 700)) / 2)
      },
      lendingTree: Math.round(((primaryData.creditScores?.lendingTree || 700) + (secondaryData.creditScores?.lendingTree || 700)) / 2),
      creditKarma: Math.round(((primaryData.creditScores?.creditKarma || 700) + (secondaryData.creditScores?.creditKarma || 700)) / 2),
      creditSesame: Math.round(((primaryData.creditScores?.creditSesame || 700) + (secondaryData.creditScores?.creditSesame || 700)) / 2),
      mrCooper: Math.round(((primaryData.creditScores?.mrCooper || 700) + (secondaryData.creditScores?.mrCooper || 700)) / 2),
      mrCooperLabel: 'Joint Household Average FICO'
    },
    creditCards: [
      ...(primaryData.creditCards || []),
      ...(secondaryData.creditCards || []).map(c => ({ ...c, id: `cons_${c.id}`, name: `[${labelB}] ${c.name}` }))
    ],
    loans: [
      ...(primaryData.loans || []),
      ...(secondaryData.loans || []).map(l => ({ ...l, id: `cons_${l.id}`, name: `[${labelB}] ${l.name}` }))
    ],
    assets: [
      ...(primaryData.assets || []),
      ...(secondaryData.assets || []).map(a => ({ ...a, id: `cons_${a.id}`, name: `[${labelB}] ${a.name}` }))
    ],
    monthlyBills: [
      ...(primaryData.monthlyBills || []),
      ...(secondaryData.monthlyBills || []).map(b => ({ ...b, id: `cons_${b.id}`, name: `[${labelB}] ${b.name}` }))
    ]
  };

  return combined;
}
