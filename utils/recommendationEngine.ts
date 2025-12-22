
import type { MonthlyData, RecommendationItem } from '../types';
import { 
  calculateTotal, 
  calculateMonthlyIncome, 
  calculateTotalBalance, 
  calculateTotalLimit, 
  calculateUtilization, 
  calculateDTI, 
  calculateNetWorth,
  formatCurrency 
} from './helpers';

export const getLocalRecommendations = (data: MonthlyData): RecommendationItem[] => {
  const recommendations: RecommendationItem[] = [];
  
  const totalIncome = calculateMonthlyIncome(data.income.jobs);
  const totalBills = calculateTotal(data.monthlyBills);
  const dti = calculateDTI(totalBills, totalIncome);
  const cardBalance = calculateTotalBalance(data.creditCards);
  const cardLimit = calculateTotalLimit(data.creditCards);
  const utilization = calculateUtilization(cardBalance, cardLimit);
  const totalAssets = calculateTotal(data.assets);
  const netWorth = calculateNetWorth(data);

  // 1. Debt Reduction Logic
  if (utilization > 30) {
    const targetCard = data.creditCards.reduce((prev, current) => (prev.balance > current.balance) ? prev : current);
    recommendations.push({
      title: "Credit Utilization Alert",
      description: `Your card utilization is at ${utilization.toFixed(1)}%. High utilization can drag down your credit score even if you pay on time.`,
      category: 'Debt Reduction',
      actionItem: `Focus on paying down "${targetCard.name}" to under ${formatCurrency(targetCard.limit * 0.3)}.`
    });
  } else if (data.loans.length > 0) {
    recommendations.push({
      title: "Debt Avalanche Strategy",
      description: "With low card utilization, you are in a prime position to aggressively target principal balances on your loans.",
      category: 'Debt Reduction',
      actionItem: "Apply an extra 10% to your highest-interest loan this month."
    });
  }

  // 2. DTI & Income Logic
  if (dti > 43) {
    recommendations.push({
      title: "DTI Ratio Optimization",
      description: `Your Debt-to-Income ratio (${dti.toFixed(1)}%) is above the 43% threshold preferred by most lenders for major loans.`,
      category: 'Strategic Move',
      actionItem: "Audit your 'Monthly Bills' for subscription fatigue or consider a debt consolidation loan."
    });
  } else {
    recommendations.push({
      title: "Strong Borrowing Power",
      description: `Your DTI of ${dti.toFixed(1)}% indicates high financial stability. You have significant leverage for better interest rates.`,
      category: 'Strategic Move',
      actionItem: "Consider requesting a credit limit increase to further suppress utilization ratios."
    });
  }

  // 3. Investment & Asset Logic
  const emergencyFundTarget = totalBills * 6;
  if (totalAssets < emergencyFundTarget) {
    recommendations.push({
      title: "Liquidity Buffer",
      description: `Based on your monthly expenses, your ideal emergency fund is ${formatCurrency(emergencyFundTarget)}.`,
      category: 'Investment',
      actionItem: "Direct current surplus cash flow into a high-yield savings account (HYSA)."
    });
  } else {
    recommendations.push({
      title: "Wealth Acceleration",
      description: "You have a solid cash buffer. Your capital is ready to work harder than a standard savings account.",
      category: 'Investment',
      actionItem: "Research tax-advantaged accounts like a Roth IRA or increase 401k contributions."
    });
  }

  // 4. Life Insurance & Protection
  const totalDebt = calculateTotalBalance(data.creditCards) + calculateTotalBalance(data.loans);
  if (totalDebt > 100000 && netWorth < totalDebt) {
    recommendations.push({
      title: "Liability Protection",
      description: `Your total liabilities (${formatCurrency(totalDebt)}) exceed your liquid net worth. This creates risk for your estate.`,
      category: 'Life Insurance & Protection',
      actionItem: "Evaluate a Term Life policy that covers your total debt footprint plus 2 years of income."
    });
  } else {
    recommendations.push({
      title: "Financial Security Check",
      description: "Your asset-to-debt ratio is healthy, but identity and asset protection should remain a priority.",
      category: 'Life Insurance & Protection',
      actionItem: "Review your 'Experian' and 'Equifax' reports for any unauthorized inquiries or accounts."
    });
  }

  return recommendations;
};
