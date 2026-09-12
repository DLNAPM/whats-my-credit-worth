
import React, { useState, useMemo } from 'react';
import type { FinancialData, MonthlyData, AccountType } from '../types';
import { formatMonthYear, calculateNetWorth, formatCurrency, isValidMonthYear } from '../utils/helpers';
import Card from './ui/Card';
import { FinancialPlanningReportModal } from './FinancialPlanningReportModal';

interface ReportsProps {
  allData: FinancialData;
  currentMonthYear?: string;
  currentMonthData?: MonthlyData;
  accountType?: AccountType;
  businessName?: string;
  businessType?: string;
  userEmail?: string;
  displayName?: string;
}

type ReportType = 'monthly' | 'quarterly' | 'annual';

const Reports: React.FC<ReportsProps> = ({
  allData,
  currentMonthYear,
  currentMonthData,
  accountType = 'personal',
  businessName,
  businessType,
  userEmail,
  displayName
}) => {
  const [reportType, setReportType] = useState<ReportType>('monthly');
  const [isFinancialPlanOpen, setIsFinancialPlanOpen] = useState(false);

  const monthYears = useMemo(() => {
    return Object.keys(allData).filter(isValidMonthYear).sort().reverse();
  }, [allData]);

  const activeMonth = useMemo(() => {
    if (currentMonthYear && allData[currentMonthYear]) return currentMonthYear;
    return monthYears[0] || new Date().toISOString().slice(0, 7);
  }, [currentMonthYear, allData, monthYears]);

  const getComparisonData = () => {
    if (monthYears.length < 2) return [];
    const comparisons: any[] = [];
    for (let i = 0; i < monthYears.length - 1; i++) {
      const currentMY = monthYears[i];
      let prevMonthYear: string | undefined;

      if (reportType === 'monthly') {
        prevMonthYear = monthYears[i + 1];
      } else if (reportType === 'quarterly') {
        const date = new Date(currentMY + "-01T12:00:00Z");
        date.setMonth(date.getMonth() - 3);
        const target = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        prevMonthYear = monthYears.find(my => my === target);
      } else if (reportType === 'annual') {
        const date = new Date(currentMY + "-01T12:00:00Z");
        date.setFullYear(date.getFullYear() - 1);
        const target = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        prevMonthYear = monthYears.find(my => my === target);
      }

      if (prevMonthYear && allData[currentMY] && allData[prevMonthYear]) {
        const cData = allData[currentMY];
        const pData = allData[prevMonthYear];

        const currentNetWorth = calculateNetWorth(cData);
        const prevNetWorth = calculateNetWorth(pData);
        const change = currentNetWorth - prevNetWorth;

        comparisons.push({
          period: `${formatMonthYear(prevMonthYear, 'short')} vs ${formatMonthYear(currentMY, 'short')}`,
          currentNetWorth,
          prevNetWorth,
          change
        });
      }
    }
    return comparisons;
  };

  const comparisonData = getComparisonData();

  return (
    <div className="space-y-8">
      {/* FINANCIAL PLANNING REPORT GENERATION CARD */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 text-white p-6 sm:p-8 shadow-xl border border-indigo-800/40">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase bg-amber-400 text-amber-950 tracking-wider">
                Fiduciary Advisory Report
              </span>
              <span className="text-xs text-blue-200">
                Period: <strong>{formatMonthYear(activeMonth)}</strong>
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Comprehensive Financial Planning Report
            </h2>
            <p className="text-sm text-blue-100/80 mt-2 leading-relaxed">
              Generate an institutional-grade, multi-topic financial advisory report highlighting your balance sheet health, Monte Carlo retirement probabilities, and strategic wealth roadmap.
            </p>

            {/* TOPICS PREVIEW CHIPS */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="text-[11px] font-bold text-blue-200 uppercase tracking-widest mb-2">
                Table of Contents Highlights:
              </div>
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                {[
                  '1. Executive Summary',
                  '2. Net Worth & Balance Sheet',
                  '3. Cash Flow Analysis',
                  '4. Retirement & Monte Carlo',
                  '5. Portfolio & Risk',
                  '6. Insurance & Liability',
                  '7. Tax & Estate Checklist',
                  '8. Action Plan & Next Steps',
                  '9. Appendix & Disclosures'
                ].map((topic, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-0.5 rounded-lg bg-white/10 hover:bg-white/15 text-blue-100 border border-white/10 font-medium transition-colors"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 flex-shrink-0">
            <button
              onClick={() => setIsFinancialPlanOpen(true)}
              className="inline-flex items-center justify-center gap-2.5 px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-extrabold rounded-2xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] active:scale-[0.99] transition-all text-sm tracking-wide"
              id="generate-financial-planning-report-btn"
            >
              <svg className="w-5 h-5 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Generate Financial Planning Report</span>
            </button>

            <span className="text-[11px] text-blue-200/70 text-center">
              Includes Interactive View, Print &amp; PDF Export
            </span>
          </div>
        </div>

        {/* Subtle decorative background circle */}
        <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* COMPARISON REPORTS SECTION */}
      <Card title="Net Worth Trajectory & Comparison Reports">
        <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-lg">
            Track balance sheet progression, delta momentum, and multi-period equity changes across monthly, quarterly, and annual snapshots.
          </p>

          <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
            {(['monthly', 'quarterly', 'annual'] as ReportType[]).map(type => (
              <button
                key={type}
                onClick={() => setReportType(type)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize ${
                  reportType === type
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {comparisonData.length > 0 ? (
          <div className="overflow-x-auto border border-gray-100 dark:border-gray-800 rounded-2xl">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800/80">
                <tr>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Period</th>
                  <th scope="col" className="px-6 py-3.5 text-right text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Ending Net Worth</th>
                  <th scope="col" className="px-6 py-3.5 text-right text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Starting Net Worth</th>
                  <th scope="col" className="px-6 py-3.5 text-right text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Period Change</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                {comparisonData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">{item.period}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">{formatCurrency(item.currentNetWorth)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">{formatCurrency(item.prevNetWorth)}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${item.change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {item.change >= 0 ? '+' : ''}{formatCurrency(item.change)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 px-4 bg-gray-50/50 dark:bg-gray-800/20 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
              {monthYears.length < 2 ? 'Multi-Month History Building' : 'No comparable data for this frequency'}
            </h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
              {monthYears.length < 2 
                ? 'You currently have one active reporting month. Add historical months in the header or use the Financial Planning Report above to audit your full current snapshot.'
                : 'Try selecting a different comparison cadence or check that past months are saved in your records.'}
            </p>
          </div>
        )}
      </Card>

      {/* FINANCIAL PLANNING REPORT MODAL */}
      <FinancialPlanningReportModal
        isOpen={isFinancialPlanOpen}
        onClose={() => setIsFinancialPlanOpen(false)}
        allData={allData}
        initialMonthYear={activeMonth}
        accountType={accountType}
        businessName={businessName}
        businessType={businessType}
        userEmail={userEmail}
        displayName={displayName}
      />
    </div>
  );
};

export default Reports;

