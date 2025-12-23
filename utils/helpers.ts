
import type { MonthlyData, CreditCard, Loan, Asset, NamedAmount, IncomeSource, FinancialData } from '../types';

export const getInitialData = (): MonthlyData => ({
  income: {
    jobs: [{ id: crypto.randomUUID(), name: 'Main Job', amount: 0, frequency: 'monthly' }],
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
    { id: crypto.randomUUID(), name: 'Primary Card', balance: 0, limit: 0 },
  ],
  loans: [
    { id: crypto.randomUUID(), name: 'Auto Loan', balance: 0, limit: 0 },
  ],
  assets: [
    { id: crypto.randomUUID(), name: 'Savings Account', value: 0 },
  ],
  monthlyBills: [{ id: crypto.randomUUID(), name: 'Rent/Mortgage', amount: 0 }],
});

export const getDummyData = (): FinancialData => {
  const currentMonth = getCurrentMonthYear();
  const m1 = currentMonth;
  const m2 = getPreviousMonthYear(m1);
  const m3 = getPreviousMonthYear(m2);
  const m4 = getPreviousMonthYear(m3);

  const createMonthlyData = (offset: number): MonthlyData => ({
    income: {
      jobs: [
        { id: crypto.randomUUID(), name: 'Global Tech Corp', amount: 4800 + (offset * 200), frequency: 'monthly' },
        { id: crypto.randomUUID(), name: 'Advisory Retainer', amount: 1200, frequency: 'monthly' }
      ]
    },
    creditScores: {
      experian: { score8: 680 + (offset * 12) },
      equifax: { score8: 675 + (offset * 10) },
      transunion: { score8: 682 + (offset * 11) },
      lendingTree: 690 + (offset * 10),
      creditKarma: 685 + (offset * 10),
      creditSesame: 680 + (offset * 10),
      mrCooper: 700 + (offset * 10)
    },
    creditCards: [
      { id: crypto.randomUUID(), name: 'Chase Sapphire', balance: 3500 - (offset * 600), limit: 12000 },
      { id: crypto.randomUUID(), name: 'Amex Gold', balance: 1200 - (offset * 200), limit: 20000 },
      { id: crypto.randomUUID(), name: 'Apple Card', balance: 400, limit: 5000 }
    ],
    loans: [
      { id: crypto.randomUUID(), name: 'Tesla Model 3 Loan', balance: 32000 - (offset * 550), limit: 45000 },
      { id: crypto.randomUUID(), name: 'SoFi Student Loan', balance: 14000 - (offset * 150), limit: 20000 }
    ],
    assets: [
      { id: crypto.randomUUID(), name: 'Marcus HYSA', value: 8000 + (offset * 1500) },
      { id: crypto.randomUUID(), name: 'Fidelity 401k', value: 24000 + (offset * 1100) },
      { id: crypto.randomUUID(), name: 'Vanguard Roth IRA', value: 6500 + (offset * 400) },
      { id: crypto.randomUUID(), name: 'Coinbase (ETH/BTC)', value: 3000 + (offset * 300) }
    ],
    monthlyBills: [
      { id: crypto.randomUUID(), name: 'Apartment Rent', amount: 2100 },
      { id: crypto.randomUUID(), name: 'Utilities & WiFi', amount: 220 },
      { id: crypto.randomUUID(), name: 'Car Insurance', amount: 180 },
      { id: crypto.randomUUID(), name: 'Gym Membership', amount: 65 },
      { id: crypto.randomUUID(), name: 'Streaming Services', amount: 45 }
    ]
  });

  return {
      [m4]: createMonthlyData(0),
      [m3]: createMonthlyData(1),
      [m2]: createMonthlyData(2),
      [m1]: createMonthlyData(3)
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
