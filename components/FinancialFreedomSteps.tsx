import React from 'react';
import { formatCurrency } from '../utils/helpers';
import Card from './ui/Card';

interface FinancialFreedomStepsProps {
  monthlyIncome: number;
}

export const FinancialFreedomSteps: React.FC<FinancialFreedomStepsProps> = ({ monthlyIncome }) => {
  const safeIncome = Math.max(0, monthlyIncome || 0);

  // Step calculations based on explicit user requirements
  const step1Target = safeIncome * 300; // Invested target to replace monthly income
  const step2MonthlyMin = safeIncome * 0.02; // Minimum monthly investment
  const step3HysaGoal = safeIncome * 3; // Saved up in HYSA
  const step4RainyDayCap = safeIncome * 0.5; // Max monthly savings for a rainy day

  const steps = [
    {
      stepNumber: 1,
      title: "Replace Monthly Income",
      multiplierLabel: "Monthly Income × 300",
      formulaText: "Monthly Income × 300",
      calculatedValue: formatCurrency(step1Target),
      badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      accentBorder: "border-l-4 border-l-blue-600 dark:border-l-blue-500",
      iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      summary: "This is how much you need to have invested in order to replace your monthly income.",
      detailText: "By building an investment portfolio 300 times your monthly income (the 4% rule equivalent), your portfolio can generate your full monthly income perpetually.",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      stepNumber: 2,
      title: "Minimum Monthly Investment",
      multiplierLabel: "Monthly Income × 0.02 (2%)",
      formulaText: "Monthly Income × 0.02",
      calculatedValue: formatCurrency(step2MonthlyMin),
      badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
      accentBorder: "border-l-4 border-l-emerald-600 dark:border-l-emerald-500",
      iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      summary: "This is how much you need to invest consistently at minimum each month.",
      detailText: "Investing at least 2% of your monthly income every single month establishes the core wealth habit to consistently build long-term compound growth.",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    },
    {
      stepNumber: 3,
      title: "High Yield Savings Reserve",
      multiplierLabel: "Monthly Income × 3",
      formulaText: "Monthly Income × 3",
      calculatedValue: formatCurrency(step3HysaGoal),
      badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      accentBorder: "border-l-4 border-l-amber-600 dark:border-l-amber-500",
      iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      summary: "This is how much you need to have saved up in a High Yield Savings Account.",
      detailText: "Having 3 months of income liquid in a high-yield savings account (HYSA) provides immediate safety against unexpected life events or employment gaps.",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0a2 2 0 104 0m-5-8a2 2 0 104 0m-4-4a2 2 0 104 0" />
        </svg>
      )
    },
    {
      stepNumber: 4,
      title: "Rainy Day Monthly Savings Cap",
      multiplierLabel: "Monthly Income × 0.5 (50%)",
      formulaText: "Monthly Income × 0.5",
      calculatedValue: formatCurrency(step4RainyDayCap),
      badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800",
      accentBorder: "border-l-4 border-l-purple-600 dark:border-l-purple-500",
      iconBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
      summary: "This is maximum amount user should save a month for a rainy day.",
      detailText: "Setting aside a maximum of 50% of your monthly income ensures you build cash reserves rapidly without over-accumulating uninvested cash that loses value to inflation.",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 00-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
      )
    }
  ];

  return (
    <Card
      title={
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-brand-primary to-indigo-700 text-white rounded-xl shadow-md">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                4 Steps to Financial Freedom
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Personalized milestone targets derived from your monthly income
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 self-start sm:self-auto">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Monthly Income Baseline:</span>
            <span className="text-sm font-bold text-brand-primary dark:text-blue-400">{formatCurrency(safeIncome)}</span>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        {steps.map((step) => (
          <div
            key={step.stepNumber}
            className={`p-5 rounded-xl bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/80 shadow-sm hover:shadow-md transition-all ${step.accentBorder} flex flex-col justify-between space-y-3`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-lg ${step.iconBg}`}>
                    {step.icon}
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Step {step.stepNumber}
                  </span>
                </div>
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${step.badgeColor}`}>
                  {step.multiplierLabel}
                </span>
              </div>

              <h3 className="text-base font-bold text-gray-900 dark:text-white mt-1">
                {step.title}
              </h3>

              <div className="mt-3 py-2 px-3 bg-gray-50 dark:bg-gray-900/60 rounded-lg border border-gray-100 dark:border-gray-700/50 flex items-baseline justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Target Amount:</span>
                <span className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  {step.calculatedValue}
                </span>
              </div>
            </div>

            <div className="space-y-1 pt-2 border-t border-gray-100 dark:border-gray-700/50">
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-snug">
                {step.summary}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">
                {step.detailText}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default FinancialFreedomSteps;
