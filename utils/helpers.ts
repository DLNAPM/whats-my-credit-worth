import type { MonthlyData, CreditCard, Loan, Asset, NamedAmount, IncomeSource, FinancialData } from '../types';

const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const getInitialData = (): MonthlyData => ({
  income: {
    jobs: [{ id: generateId(), name: 'Main Job', amount: 0, frequency: 'monthly' }],
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
    { id: generateId(), name: 'Primary Card', balance: 0, limit: 0 },
  ],
  loans: [
    { id: generateId(), name: 'Auto Loan', balance: 0, limit: 0 },
  ],
  assets: [
    { id: generateId(), name: 'Savings Account', value: 0 },
  ],
  monthlyBills: [{ id: generateId(), name: 'Rent/Mortgage', amount: 0 }],
});

export const getDummyData = (): FinancialData => {
  const currentMonth = getCurrentMonthYear();
  const m1 = currentMonth;
  const m2 = getPreviousMonthYear(m1);
  const m3 = getPreviousMonthYear(m2);
  const m4 = getPreviousMonthYear(m3);

  // Helper to create historical months with a growth trend
  // offset 0 is oldest, offset 3 is current
  const createMonthlyData = (offset: number): MonthlyData => ({
    income: {
      jobs: [
        { id: generateId(), name: 'Senior Engineer @ Tech Co', amount: 7500 + (offset * 250), frequency: 'monthly' },
        { id: generateId(), name: 'Freelance Design', amount: 800 + (offset * 100), frequency: 'monthly' }
      ]
    },
    creditScores: {
      experian: { score8: 685 + (offset * 15) },
      equifax: { score8: 680 + (offset * 12) },
      transunion: { score8: 690 + (offset * 14) },
      lendingTree: 695 + (offset * 10),
      creditKarma: 690 + (offset * 10),
      creditSesame: 685 + (offset * 10),
      mrCooper: 710 + (offset * 10)
    },
    creditCards: [
      { id: generateId(), name: 'Chase Sapphire Pref', balance: Math.max(0, 4200 - (offset * 1100)), limit: 15000 },
      { id: generateId(), name: 'Amex Platinum', balance: Math.max(0, 1500 - (offset * 400)), limit: 30000 },
      { id: generateId(), name: 'Apple Card', balance: 200, limit: 8000 }
    ],
    loans: [
      { id: generateId(), name: 'Mortgage (Fixed 3.5%)', balance: 345000 - (offset * 800), limit: 420000 },
      { id: generateId(), name: 'BMW i4 Lease/Loan', balance: 42000 - (offset * 650), limit: 65000 }
    ],
    assets: [
      { id: generateId(), name: 'Marcus Savings', value: 12000 + (offset * 2000) },
      { id: generateId(), name: 'Fidelity 401k', value: 85000 + (offset * 3200) },
      { id: generateId(), name: 'Coinbase (BTC)', value: 15000 + (offset * 1100) },
      { id: generateId(), name: 'Home Equity', value: 125000 + (offset * 500) }
    ],
    monthlyBills: [
      { id: generateId(), name: 'Mortgage Payment', amount: 2450 },
      { id: generateId(), name: 'Utilities', amount: 310 },
      { id: generateId(), name: 'Car Insurance', amount: 210 },
      { id: generateId(), name: 'Subscriptions', amount: 125 }
    ]
  });

  return {
      [m4]: createMonthlyData(0), // Oldest
      [m3]: createMonthlyData(1),
      [m2]: createMonthlyData(2),
      [m1]: createMonthlyData(3)  // Most Recent
  };
};

export const calculateTotal = (items: (NamedAmount | Asset)[] = []) => {
  if (!items) return 0;
  return items.reduce((acc, item) => {
    const val = 'amount' in item ? item.amount : item.value;
    return acc + (Number(val) || 0);
  }, 0);
};

export const calculateMonthlyIncome = (jobs: IncomeSource[] = []): number => {
  if (!jobs) return 0;
  return jobs.reduce((total, job) => {
    let monthlyAmount = 0;
    const weeksInMonth = 52 / 12; 
    const amount = Number(job.amount) || 0;
    switch (job.frequency) {
      case 'weekly':
        monthlyAmount = amount * weeksInMonth;
        break;
      case 'bi-weekly':
        monthlyAmount = amount * (weeksInMonth / 2);
        break;
      case 'twice-a-month':
        monthlyAmount = amount * 2;
        break;
      case 'monthly':
        monthlyAmount = amount;
        break;
      case 'yearly':
        monthlyAmount = amount / 12;
        break;
    }
    return total + monthlyAmount;
  }, 0);
};

export const calculateTotalBalance = (items: (CreditCard | Loan)[] = []) => {
  if (!items) return 0;
  return items.reduce((acc, item) => acc + (Number(item.balance) || 0), 0);
};

export const calculateTotalLimit = (items: (CreditCard | Loan)[] = []) => {
  if (!items) return 0;
  return items.reduce((acc, item) => acc + (Number(item.limit) || 0), 0);
};

export const calculateUtilization = (balance: number, limit: number): number => {
  if (limit === 0 || isNaN(limit)) return 0;
  return (balance / limit) * 100;
};

export const calculateDTI = (monthlyBills: number, monthlyIncome: number): number => {
  if (monthlyIncome === 0 || isNaN(monthlyIncome)) return 0;
  return (monthlyBills / monthlyIncome) * 100;
};

export const calculateNetWorth = (data?: MonthlyData): number => {
  if (!data) return 0;
  const totalAssets = calculateTotal(data.assets);
  const totalLiabilities = calculateTotalBalance(data.creditCards) + calculateTotalBalance(data.loans);
  return totalAssets - totalLiabilities;
};

export const formatCurrency = (amount: number): string => {
  if (isNaN(amount)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const getCurrentMonthYear = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
};

export const formatMonthYear = (monthYear: string, format: 'long' | 'short' | 'numeric' | '2-digit' | 'narrow' = 'long'): string => {
    if (!monthYear) return '';
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