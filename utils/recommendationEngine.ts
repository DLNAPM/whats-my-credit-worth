
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

import type { MonthlyData, RecommendationItem, AccountType } from '../types';
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

export const getLocalRecommendations = (
  data: MonthlyData, 
  accountType: AccountType = 'personal',
  businessName?: string
): RecommendationItem[] => {
  const recommendations: RecommendationItem[] = [];
  
  const totalIncome = calculateMonthlyIncome(data.income.jobs);
  const totalBills = calculateTotal(data.monthlyBills);
  const dti = calculateDTI(totalBills, totalIncome);
  const cardBalance = calculateTotalBalance(data.creditCards);
  const cardLimit = calculateTotalLimit(data.creditCards);
  const utilization = calculateUtilization(cardBalance, cardLimit);
  const totalAssets = calculateTotal(data.assets);
  const netWorth = calculateNetWorth(data);
  const totalDebt = cardBalance + calculateTotalBalance(data.loans);

  if (accountType === 'business') {
    const bizPrefix = businessName ? `"${businessName}"` : 'Your business';

    // 1. Business Debt & Credit Facility Logic
    if (utilization > 25) {
      const targetCard = data.creditCards.reduce((prev, current) => (prev.balance > current.balance) ? prev : current);
      recommendations.push({
        title: "Commercial Credit & Line of Credit Utilization",
        description: `${bizPrefix} revolving credit utilization is at ${utilization.toFixed(1)}%. Commercial lenders prefer credit lines under 25% to grant tier-1 prime interest rates.`,
        category: 'Debt Reduction',
        actionItem: `Pay down revolving credit line "${targetCard.name}" below ${formatCurrency(targetCard.limit * 0.25)} to protect commercial credit rating.`
      });
    } else if (data.loans.length > 0) {
      recommendations.push({
        title: "Commercial Debt Optimization",
        description: `With commercial credit line utilization at a healthy ${utilization.toFixed(1)}%, evaluate refinancing high-interest short-term notes into long-term SBA 7(a) or commercial facilities.`,
        category: 'Debt Reduction',
        actionItem: "Audit commercial debt covenants and negotiate lower margin spreads with your commercial banker."
      });
    }

    // 2. DSCR (Debt Service Coverage Ratio) Underwriting Standards
    // DSCR = Total Operating Income / Monthly Debt & Expense Service
    const dscr = totalBills > 0 ? (totalIncome / totalBills) : 2.5;
    if (dscr < 1.25) {
      recommendations.push({
        title: "Debt Service Coverage Ratio (DSCR) Alert",
        description: `Your DSCR is currently ${dscr.toFixed(2)}x. Standard commercial and SBA lending guidelines mandate a minimum 1.25x coverage ratio to qualify for business expansion loans.`,
        category: 'Strategic Move',
        actionItem: "Reduce non-essential operating expenses (OPEX) or renegotiate vendor contracts to raise DSCR above 1.25x."
      });
    } else {
      recommendations.push({
        title: "Prime Commercial Borrowing Capacity",
        description: `Your strong DSCR of ${dscr.toFixed(2)}x easily exceeds the 1.25x institutional threshold, positioning ${bizPrefix} for prime commercial credit facilities.`,
        category: 'Strategic Move',
        actionItem: "Establish or increase a revolving Business Line of Credit (BLOC) while your underwriting profile is robust."
      });
    }

    // 3. Operating Expense (OPEX) Runway & Working Capital
    const opexBufferTarget = totalBills * 4;
    if (totalAssets < opexBufferTarget) {
      recommendations.push({
        title: "Working Capital & OPEX Runway Buffer",
        description: `Standard business risk policies recommend maintaining at least 3 to 6 months of operating expenses (${formatCurrency(opexBufferTarget)}) in liquid treasury reserves.`,
        category: 'Investment',
        actionItem: "Sweep operating cash surpluses into an insured Business High-Yield Treasury or Money Market Account."
      });
    } else {
      recommendations.push({
        title: "Capital Allocation & Business Reinvestment",
        description: `${bizPrefix} has a healthy working capital runway. Deploy excess liquid capital into revenue-generating business assets.`,
        category: 'Investment',
        actionItem: "Evaluate Section 179 tax deductions for equipment, software, or capital assets purchased this tax year."
      });
    }

    // 4. Corporate Asset Protection & Commercial Risk Policies
    if (totalDebt > 50000) {
      recommendations.push({
        title: "Corporate Veil & Personal Guarantee Mitigation",
        description: `${bizPrefix} carries ${formatCurrency(totalDebt)} in total commercial liabilities. Ensure business debt is insulated from personal assets.`,
        category: 'Life Insurance & Protection',
        actionItem: "Establish vendor Trade Credit (Net-30/60) to build D&B Paydex scores and reduce reliance on personal guarantees."
      });
    } else {
      recommendations.push({
        title: "Commercial Risk & Key Person Coverage",
        description: "Maintain comprehensive commercial general liability (CGL), errors & omissions, and key person insurance to safeguard business continuity.",
        category: 'Life Insurance & Protection',
        actionItem: "Review Commercial Umbrella policies and verify business credit separation with Experian Business & Dun & Bradstreet."
      });
    }

    return recommendations;
  }

  // PERSONAL FINANCIAL STANDARDS (Default)
  // 1. Debt Reduction Logic
  if (utilization > 30) {
    const targetCard = data.creditCards.reduce((prev, current) => (prev.balance > current.balance) ? prev : current);
    recommendations.push({
      title: "Credit Utilization Alert (Consumer FICO Policy)",
      description: `Your revolving card utilization is at ${utilization.toFixed(1)}%. Keeping utilization under 30% (ideally <10%) is crucial for maximizing consumer FICO 8 & Mortgage scores.`,
      category: 'Debt Reduction',
      actionItem: `Focus on paying down "${targetCard.name}" to under ${formatCurrency(targetCard.limit * 0.3)}.`
    });
  } else if (data.loans.length > 0) {
    recommendations.push({
      title: "Debt Avalanche Strategy",
      description: "With low consumer card utilization, you are in a prime position to aggressively target principal balances on your personal loans and mortgage.",
      category: 'Debt Reduction',
      actionItem: "Apply an extra 10% to your highest-interest personal loan this month."
    });
  }

  // 2. DTI & Income Logic
  if (dti > 43) {
    recommendations.push({
      title: "Household DTI Ratio Optimization",
      description: `Your Debt-to-Income ratio (${dti.toFixed(1)}%) exceeds the 43% Qualified Mortgage standard preferred by residential lenders.`,
      category: 'Strategic Move',
      actionItem: "Audit your household monthly bills for subscription fatigue or consider a personal debt consolidation plan."
    });
  } else {
    recommendations.push({
      title: "Strong Personal Borrowing Power",
      description: `Your household DTI of ${dti.toFixed(1)}% indicates high financial stability under Fannie Mae / Freddie Mac underwriting guidelines.`,
      category: 'Strategic Move',
      actionItem: "Consider requesting a credit limit increase to further suppress personal revolving utilization."
    });
  }

  // 3. Investment & Asset Logic
  const emergencyFundTarget = totalBills * 6;
  if (totalAssets < emergencyFundTarget) {
    recommendations.push({
      title: "Personal Emergency Reserve Buffer",
      description: `Based on your household expenses, your ideal 6-month emergency reserve is ${formatCurrency(emergencyFundTarget)}.`,
      category: 'Investment',
      actionItem: "Direct current surplus cash flow into a high-yield savings account (HYSA) or liquid money market fund."
    });
  } else {
    recommendations.push({
      title: "Personal Wealth Acceleration",
      description: "You have a solid cash buffer. Your capital is ready to work harder than a standard savings account.",
      category: 'Investment',
      actionItem: "Maximize tax-advantaged accounts like a Roth IRA, HSA, or increase 401(k) retirement contributions."
    });
  }

  // 4. Life Insurance & Family Protection
  if (totalDebt > 100000 && netWorth < totalDebt) {
    recommendations.push({
      title: "Personal Liability & Estate Protection",
      description: `Your total personal liabilities (${formatCurrency(totalDebt)}) exceed your liquid net worth, creating financial exposure for your family estate.`,
      category: 'Life Insurance & Protection',
      actionItem: "Evaluate a 20-30 Year Term Life insurance policy that covers your total debt footprint plus 2 years of income replacement."
    });
  } else {
    recommendations.push({
      title: "Financial Security & Identity Check",
      description: "Your personal asset-to-debt ratio is healthy. Maintain credit monitoring and fraud freeze protocols.",
      category: 'Life Insurance & Protection',
      actionItem: "Review your Experian, Equifax, and TransUnion reports for unauthorized inquiries or score discrepancies."
    });
  }

  return recommendations;
};
