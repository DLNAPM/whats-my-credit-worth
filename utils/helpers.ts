
import type { MonthlyData, CreditCard, Loan, Asset, NamedAmount, IncomeSource, FinancialData } from '../types';

export const getInitialData = (): MonthlyData => ({
  income: {
    jobs: [{ id: crypto.randomUUID(), name: 'Job 1', amount: 0, frequency: 'bi-weekly' }],
  },
  creditScores: {
    experian: { score8: 0 },
    equifax: { score8: 0 },
    transunion: { score8: 0 },
    lendingTree: 0,
    creditKarma: 0,
    creditSesame: 0,
    mrCooper: 0,
  },
  creditCards: [
    { id: crypto.randomUUID(), name: 'CC1', balance: 0, limit: 0 },
    { id: crypto.randomUUID(), name: 'CC2', balance: 0, limit: 0 },
    { id: crypto.randomUUID(), name: 'CC3', balance: 0, limit: 0 },
    { id: crypto.randomUUID(), name: 'CC4', balance: 0, limit: 0 },
  ],
  loans: [
    { id: crypto.randomUUID(), name: 'Loan1', balance: 0, limit: 0 },
    { id: crypto.randomUUID(), name: 'Loan2', balance: 0, limit: 0 },
    { id: crypto.randomUUID(), name: 'Loan3', balance: 0, limit: 0 },
  ],
  assets: [
    { id: crypto.randomUUID(), name: '401k', value: 0 },
    { id: crypto.randomUUID(), name: 'IRA', value: 0 },
    { id: crypto.randomUUID(), name: 'Asset3', value: 0 },
  ],
  monthlyBills: [{ id: crypto.randomUUID(), name: 'Electric', amount: 0 }],
});

export const getDummyData = (): FinancialData => {
  const currentMonth = getCurrentMonthYear();
  const prevMonth = getPreviousMonthYear(currentMonth);
  const prev2Month = getPreviousMonthYear(prevMonth);

  const createMonthlyData = (offset: number): MonthlyData => ({
    income: {
      jobs: [
        { id: crypto.randomUUID(), name: 'Tech Corp Inc.', amount: 5200 + (offset * 150), frequency: 'monthly' },
        { id: crypto.randomUUID(), name: 'Consulting Gig', amount: 1500, frequency: 'monthly' }
      ]
    },
    creditScores: {
      experian: { score8: 720 + (offset * 5) },
      equifax: { score8: 715 + (offset * 4) },
      transunion: { score8: 718 + (offset * 6) },
      lendingTree: 725 + (offset * 5),
      creditKarma: 720 + (offset * 5),
      creditSesame: 718 + (offset * 5),
      mrCooper: 730 + (offset * 5)
    },
    creditCards: [
      { id: crypto.randomUUID(), name: 'Sapphire Preferred', balance: 1200 - (offset * 100), limit: 15000 },
      { id: crypto.randomUUID(), name: 'Freedom Unlimited', balance: 450, limit: 8000 },
      { id: crypto.randomUUID(), name: 'Amex Gold', balance: 800 + (offset * 50), limit: 25000 }
    ],
    loans: [
      { id: crypto.randomUUID(), name: 'Car Loan', balance: 18000 - (offset * 400), limit: 25000 },
      { id: crypto.randomUUID(), name: 'Student Loan', balance: 12000 - (offset * 100), limit: 15000 }
    ],
    assets: [
      { id: crypto.randomUUID(), name: 'High Yield Savings', value: 15000 + (offset * 1000) },
      { id: crypto.randomUUID(), name: '401k', value: 45000 + (offset * 1200) },
      { id: crypto.randomUUID(), name: 'Roth IRA', value: 12000 + (offset * 500) },
      { id: crypto.randomUUID(), name: 'Crypto Wallet', value: 2500 + (offset * 200) }
    ],
    monthlyBills: [
      { id: crypto.randomUUID(), name: 'Rent', amount: 1800 },
      { id: crypto.randomUUID(), name: 'Utilities', amount: 150 },
      { id: crypto.randomUUID(), name: 'Insurance', amount: 120 },
      { id: crypto.randomUUID(), name: 'Groceries', amount: 600 }
    ]
  });

  // Return 3 months of data with slight progression
  return {
      [prev2Month]: createMonthlyData(0),
      [prevMonth]: createMonthlyData(1),
      [currentMonth]: createMonthlyData(2)
  };
};


export const calculateTotal = (items: (NamedAmount | Asset)[]) => {
  return items.reduce((acc, item) => acc + ('amount' in item ? item.amount : item.value), 0);
};

export const calculateMonthlyIncome = (jobs: IncomeSource[]): number => {
  return jobs.reduce((total, job) => {
    let monthlyAmount = 0;
    const weeksInMonth = 52 / 12; 
    switch (job.frequency) {
      case 'weekly':
        monthlyAmount = job.amount * weeksInMonth;
        break;
      case 'bi-weekly':
        monthlyAmount = job.amount * (weeksInMonth / 2);
        break;
      case 'twice-a-month':
        monthlyAmount = job.amount * 2;
        break;
      case 'monthly':
        monthlyAmount = job.amount;
        break;
      case 'yearly':
        monthlyAmount = job.amount / 12;
        break;
    }
    return total + monthlyAmount;
  }, 0);
};

export const calculateTotalBalance = (items: (CreditCard | Loan)[]) => {
  return items.reduce((acc, item) => acc + item.balance, 0);
};

export const calculateTotalLimit = (items: (CreditCard | Loan)[]) => {
  return items.reduce((acc, item) => acc + item.limit, 0);
};

export const calculateUtilization = (balance: number, limit: number): number => {
  if (limit === 0) return 0;
  return (balance / limit) * 100;
};

export const calculateDTI = (monthlyBills: number, monthlyIncome: number): number => {
  if (monthlyIncome === 0) return 0;
  return (monthlyBills / monthlyIncome) * 100;
};

export const calculateNetWorth = (data?: MonthlyData): number => {
  if (!data) return 0;
  const totalAssets = calculateTotal(data.assets);
  const totalLiabilities = calculateTotalBalance(data.creditCards) + calculateTotalBalance(data.loans);
  return totalAssets - totalLiabilities;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const getCurrentMonthYear = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
};

// FIX: The `format` parameter for `toLocaleString`'s `month` option must be a specific string literal.
// Changed the type of `format` from `string` to a union of allowed values.
export const formatMonthYear = (monthYear: string, format: 'long' | 'short' | 'numeric' | '2-digit' | 'narrow' = 'long'): string => {
    const [year, month] = monthYear.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString('default', { month: format, year: 'numeric' });
};

export const getPreviousMonthYear = (monthYear: string): string => {
    let [year, month] = monthYear.split('-').map(Number);
    if (month === 1) {
        year -= 1;
        month = 12;
    } else {
        month -= 1;
    }
    return `${year}-${month.toString().padStart(2, '0')}`;
}

export const getNextMonthYear = (monthYear: string): string => {
    let [year, month] = monthYear.split('-').map(Number);
    if (month === 12) {
        year += 1;
        month = 1;
    } else {
        month += 1;
    }
    return `${year}-${month.toString().padStart(2, '0')}`;
}

export const getUtilizationColor = (utilization: number): string => {
  if (utilization > 70) return 'text-red-500';
  if (utilization > 30) return 'text-yellow-500';
  return 'text-green-500';
};