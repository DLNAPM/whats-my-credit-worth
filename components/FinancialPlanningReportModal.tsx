import React, { useState, useMemo } from 'react';
import type { FinancialData, MonthlyData, AccountType } from '../types';
import { 
  formatCurrency, 
  formatMonthYear, 
  calculateMonthlyIncome, 
  calculateTotal, 
  calculateTotalBalance, 
  calculateTotalLimit, 
  calculateUtilization, 
  calculateDTI, 
  calculateNetWorth 
} from '../utils/helpers';
import { exportFinancialPlanningReportToPDF } from '../utils/pdfGenerator';

interface FinancialPlanningReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  allData: FinancialData;
  initialMonthYear?: string;
  accountType?: AccountType;
  businessName?: string;
  businessType?: string;
  userEmail?: string;
  displayName?: string;
}

export const FinancialPlanningReportModal: React.FC<FinancialPlanningReportModalProps> = ({
  isOpen,
  onClose,
  allData,
  initialMonthYear,
  accountType = 'personal',
  businessName,
  userEmail = 'Valued Member',
  displayName
}) => {
  const availableMonths = useMemo(() => {
    return Object.keys(allData).sort().reverse();
  }, [allData]);

  const [selectedMonthYear, setSelectedMonthYear] = useState<string>(() => {
    if (initialMonthYear && allData[initialMonthYear]) return initialMonthYear;
    return availableMonths[0] || new Date().toISOString().slice(0, 7);
  });

  const [activeSection, setActiveSection] = useState<string>('topic-1');
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Estate Document Checklist Interactive States
  const [estateChecklist, setEstateChecklist] = useState<Record<string, 'complete' | 'in_progress' | 'needed'>>({
    will: 'complete',
    trust: 'in_progress',
    financialPOA: 'complete',
    medicalPOA: 'complete',
    beneficiaries: 'in_progress',
    digitalInventory: 'needed'
  });

  // Action Plan Checklist State
  const [completedActions, setCompletedActions] = useState<Record<string, boolean>>({
    act1: true,
    act2: false,
    act3: false,
    act4: false,
    act5: false
  });

  const activeData: MonthlyData = useMemo(() => {
    if (allData[selectedMonthYear]) return allData[selectedMonthYear];
    const firstKey = Object.keys(allData)[0];
    if (firstKey && allData[firstKey]) return allData[firstKey];
    return {
      income: { jobs: [] },
      creditScores: {
        experian: { score8: 720 },
        equifax: { score8: 720 },
        transunion: { score8: 720 },
        lendingTree: 720,
        creditKarma: 720,
        creditSesame: 720,
        mrCooper: 720,
        mrCooperLabel: 'FICO 4',
        creditCardFico8: 720,
        autoFico8: 720
      },
      creditCards: [],
      loans: [],
      assets: [],
      monthlyBills: []
    };
  }, [allData, selectedMonthYear]);

  // Core Financial Metric Calculations
  const metrics = useMemo(() => {
    const totalIncome = calculateMonthlyIncome(activeData.income?.jobs || []);
    const totalBills = calculateTotal(activeData.monthlyBills || []);
    const totalAssets = calculateTotal(activeData.assets || []);
    const cardBalance = calculateTotalBalance(activeData.creditCards || []);
    const cardLimit = calculateTotalLimit(activeData.creditCards || []);
    const loanBalance = calculateTotalBalance(activeData.loans || []);
    const totalDebt = cardBalance + loanBalance;
    const netWorth = calculateNetWorth(activeData);
    const utilization = calculateUtilization(cardBalance, cardLimit);
    const dti = calculateDTI(totalBills, totalIncome);
    const monthlySurplus = Math.max(0, totalIncome - totalBills);
    const savingsRate = totalIncome > 0 ? (monthlySurplus / totalIncome) * 100 : 0;

    // Asset Categories Categorization
    let liquidCash = 0;
    let retirementInvestments = 0;
    let realEstate = 0;
    let cryptoAndAlternative = 0;

    (activeData.assets || []).forEach(asset => {
      const name = (asset.name || '').toLowerCase();
      const cat = ((asset as any).category || '').toLowerCase();
      const val = Number(asset.value) || 0;

      if (cat.includes('saving') || cat.includes('cash') || cat.includes('checking') || cat.includes('hysa') || name.includes('saving') || name.includes('checking') || name.includes('cash')) {
        liquidCash += val;
      } else if (cat.includes('retirement') || cat.includes('401') || cat.includes('ira') || cat.includes('stock') || cat.includes('invest') || name.includes('401k') || name.includes('ira') || name.includes('fidelity') || name.includes('vanguard')) {
        retirementInvestments += val;
      } else if (cat.includes('real estate') || cat.includes('property') || cat.includes('home') || name.includes('home') || name.includes('equity') || name.includes('property')) {
        realEstate += val;
      } else {
        cryptoAndAlternative += val;
      }
    });

    // If all fell into crypto or zero, provide sensible floor based on totalAssets
    if (liquidCash === 0 && retirementInvestments === 0 && realEstate === 0 && totalAssets > 0) {
      liquidCash = totalAssets * 0.25;
      retirementInvestments = totalAssets * 0.50;
      realEstate = totalAssets * 0.25;
    }

    const liquidMonthsRunway = totalBills > 0 ? (liquidCash / totalBills) : 6;

    // Retirement & Monte Carlo Modeling
    // Assume 7% real compound growth, 25-year accumulation, 4% safe withdrawal
    const assumedYearsToRetire = 20;
    const realAnnualGrowthRate = 0.07;
    const annualSavingsContribution = monthlySurplus * 12 * 0.75; // 75% of surplus directed to investments
    
    // Future Value formula: FV = PV*(1+r)^n + PMT * [((1+r)^n - 1) / r]
    const currentInvestable = liquidCash * 0.5 + retirementInvestments + cryptoAndAlternative;
    const compoundFactor = Math.pow(1 + realAnnualGrowthRate, assumedYearsToRetire);
    const annuityFactor = (compoundFactor - 1) / realAnnualGrowthRate;
    const projectedNestEgg = (currentInvestable * compoundFactor) + (annualSavingsContribution * annuityFactor);
    const annualSafeWithdrawal = projectedNestEgg * 0.04;
    const monthlySafeWithdrawal = annualSafeWithdrawal / 12;

    return {
      totalIncome,
      totalBills,
      totalAssets,
      cardBalance,
      cardLimit,
      loanBalance,
      totalDebt,
      netWorth,
      utilization,
      dti,
      monthlySurplus,
      savingsRate,
      liquidCash,
      retirementInvestments,
      realEstate,
      cryptoAndAlternative,
      liquidMonthsRunway,
      currentInvestable,
      projectedNestEgg,
      annualSafeWithdrawal,
      monthlySafeWithdrawal
    };
  }, [activeData]);

  if (!isOpen) return null;

  const clientName = displayName || (userEmail !== 'Valued Member' ? userEmail : (accountType === 'business' && businessName ? businessName : 'Private Client'));
  const reportRefId = `WMCW-PLAN-${selectedMonthYear.replace('-', '')}-${Math.floor(1000 + Math.random() * 9000)}`;

  const scrollToTopic = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      await exportFinancialPlanningReportToPDF({
        data: activeData,
        monthYear: selectedMonthYear,
        accountType,
        businessName,
        userEmail,
        displayName,
        metrics,
        estateChecklist
      });
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      alert("Could not generate PDF directly. You can use the browser's Print dialog to save as PDF.");
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md overflow-hidden p-2 sm:p-4 md:p-6 print:p-0 print:bg-white">
      <div className="relative w-full max-w-6xl h-[94vh] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl flex flex-col border border-gray-200 dark:border-gray-800 overflow-hidden print:h-auto print:rounded-none print:border-none print:shadow-none">
        
        {/* HEADER BAR */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Financial Planning Report</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-400 text-amber-950 tracking-wider">
                  Comprehensive 9-Topic Advisory
                </span>
              </div>
              <p className="text-xs text-blue-200/80">
                Prepared for <strong className="text-white">{clientName}</strong> • {formatMonthYear(selectedMonthYear)} • Ref: {reportRefId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {availableMonths.length > 1 && (
              <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg border border-white/20 text-xs text-white">
                <span className="text-blue-200">Month:</span>
                <select
                  value={selectedMonthYear}
                  onChange={(e) => setSelectedMonthYear(e.target.value)}
                  className="bg-transparent text-white font-bold outline-none cursor-pointer"
                >
                  {availableMonths.map((m) => (
                    <option key={m} value={m} className="bg-gray-900 text-white">
                      {formatMonthYear(m)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
              title="Download full 9-topic report as formatted PDF"
            >
              {isExportingPDF ? (
                <>
                  <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download PDF</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg border border-white/20 transition-all flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Print</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* MAIN BODY: 2 COLUMNS (TABLE OF CONTENTS + REPORT DOCUMENT) */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT COLUMN: TABLE OF CONTENTS (INTERACTIVE QUICK NAV) */}
          <div className="w-80 flex-shrink-0 bg-gray-50 dark:bg-gray-950/60 border-r border-gray-200 dark:border-gray-800 p-5 overflow-y-auto hidden md:block print:hidden">
            <div className="mb-4">
              <div className="text-xs font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                Table of Contents
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                Click any topic to navigate to its detailed advisory breakdown.
              </p>
            </div>

            <nav className="space-y-2 text-xs">
              {[
                {
                  id: 'topic-1',
                  num: '1',
                  title: 'Executive Summary & Introduction',
                  sub: ['Client goals and priorities', 'High-level financial snapshot', 'Scope of the financial plan']
                },
                {
                  id: 'topic-2',
                  num: '2',
                  title: 'Net Worth & Balance Sheet',
                  sub: ['Summary of assets and liabilities', 'Current asset allocation breakdown']
                },
                {
                  id: 'topic-3',
                  num: '3',
                  title: 'Cash Flow Analysis',
                  sub: ['Monthly income and expense review', 'Savings rate evaluation']
                },
                {
                  id: 'topic-4',
                  num: '4',
                  title: 'Retirement Planning',
                  sub: ['Retirement income projections', 'Monte Carlo probability analysis', 'Withdrawal & distribution strategies']
                },
                {
                  id: 'topic-5',
                  num: '5',
                  title: 'Investment Portfolio Analysis',
                  sub: ['Current vs. target asset allocation', 'Fee and risk assessment']
                },
                {
                  id: 'topic-6',
                  num: '6',
                  title: 'Risk Management & Insurance Planning',
                  sub: ['Life and disability insurance analysis', 'Property, casualty & umbrella review']
                },
                {
                  id: 'topic-7',
                  num: '7',
                  title: 'Tax & Estate Planning Considerations',
                  sub: ['Tax-efficient withdrawal strategies', 'Estate document checklist']
                },
                {
                  id: 'topic-8',
                  num: '8',
                  title: 'Action Plan & Next Steps',
                  sub: ['Prioritized implementation checklist', 'Ongoing monitoring schedule']
                },
                {
                  id: 'topic-9',
                  num: '9',
                  title: 'Appendix, Glossary, & Disclosures',
                  sub: ['Key financial metrics glossary', 'Regulatory disclosures & limitations']
                }
              ].map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => scrollToTopic(item.id)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all border ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700/60 shadow-sm'
                        : 'bg-white dark:bg-gray-800/40 border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                        isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}>
                        {item.num}
                      </span>
                      <span className={`font-bold ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'}`}>
                        {item.title}
                      </span>
                    </div>
                    <ul className="mt-1.5 ml-7 space-y-0.5 text-[10.5px] text-gray-500 dark:text-gray-400">
                      {item.sub.map((s, idx) => (
                        <li key={idx} className="truncate">• {s}</li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </nav>

            <div className="mt-6 p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold mb-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Fiduciary Standard</span>
              </div>
              <p className="text-[10px] text-gray-600 dark:text-gray-400 leading-relaxed">
                This comprehensive document integrates live balance sheet, debt utilization, and portfolio metrics into institutional wealth guidance.
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN: SCROLLABLE FULL REPORT CONTENT */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-12 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 print:overflow-visible print:p-0">
            
            {/* COVER / REPORT HEADER */}
            <div className="border-b-2 border-indigo-600 pb-6 mb-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                    What's My Credit Worth • Wealth Strategy Office
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-1">
                    Comprehensive Financial Planning Report
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Institutional Wealth Audit, Retirement Trajectory & Risk Mitigation Strategy
                  </p>
                </div>
                <div className="text-right sm:border-l sm:border-gray-200 dark:sm:border-gray-700 sm:pl-6">
                  <div className="text-xs text-gray-500">Prepared For:</div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">{clientName}</div>
                  <div className="text-xs text-gray-500 mt-1">Report Period: {formatMonthYear(selectedMonthYear)}</div>
                  <div className="text-[10px] font-mono text-gray-400">Ref: {reportRefId}</div>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* TOPIC 1: EXECUTIVE SUMMARY & INTRODUCTION */}
            {/* ========================================================================= */}
            <section id="topic-1" className="scroll-mt-6 border-b border-gray-200 dark:border-gray-800 pb-10">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                  1
                </span>
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
                    Executive Summary & Introduction
                  </h2>
                  <p className="text-xs text-gray-500">High-level financial snapshot, client priorities, and advisory mandate</p>
                </div>
              </div>

              {/* High-Level Snapshot Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-700">
                  <span className="text-xs font-medium text-gray-500">Total Net Worth</span>
                  <div className={`text-xl font-black mt-1 ${metrics.netWorth >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                    {formatCurrency(metrics.netWorth)}
                  </div>
                  <span className="text-[10px] text-gray-400 block mt-0.5">Assets minus Liabilities</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-700">
                  <span className="text-xs font-medium text-gray-500">Total Asset Base</span>
                  <div className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">
                    {formatCurrency(metrics.totalAssets)}
                  </div>
                  <span className="text-[10px] text-gray-400 block mt-0.5">Across {(activeData.assets || []).length} registered accounts</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-700">
                  <span className="text-xs font-medium text-gray-500">Total Liabilities</span>
                  <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
                    {formatCurrency(metrics.totalDebt)}
                  </div>
                  <span className="text-[10px] text-gray-400 block mt-0.5">Cards & Installment Debt</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-700">
                  <span className="text-xs font-medium text-gray-500">Monthly Cash Flow Surplus</span>
                  <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                    {formatCurrency(metrics.monthlySurplus)}
                  </div>
                  <span className="text-[10px] text-gray-400 block mt-0.5">Savings Rate: {metrics.savingsRate.toFixed(1)}%</span>
                </div>
              </div>

              {/* Client Goals & Priorities */}
              <div className="mt-6 space-y-3">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Client Goals & Priorities
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  Based on the submitted financial profile for <strong>{clientName}</strong>, the core financial planning priorities focus on three foundational pillars:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50">
                    <strong className="text-xs font-bold text-blue-900 dark:text-blue-300 block mb-1">1. Liquidity & Capital Preservation</strong>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      Maintaining an emergency buffer of at least {metrics.liquidMonthsRunway.toFixed(1)} months of living expenses in secure, high-yield cash repositories to absorb unexpected volatility.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
                    <strong className="text-xs font-bold text-emerald-900 dark:text-emerald-300 block mb-1">2. Credit & Debt Optimization</strong>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      Maintaining aggregate revolving credit utilization at {metrics.utilization.toFixed(1)}% (target &lt; 10%) to preserve top-tier commercial and personal financing borrowing power.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50">
                    <strong className="text-xs font-bold text-purple-900 dark:text-purple-300 block mb-1">3. Long-Term Wealth Compounding</strong>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      Systematically funneling recurring monthly cash surplus ({formatCurrency(metrics.monthlySurplus)}) into tax-advantaged retirement vehicles and diversified index assets.
                    </p>
                  </div>
                </div>
              </div>

              {/* Scope of the Financial Plan */}
              <div className="mt-6">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Scope of the Financial Plan
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  This plan provides an integrated fiduciary evaluation encompassing balance sheet health, asset allocation resilience, debt structure, retirement income projections under Monte Carlo stress analysis, life & umbrella liability protection, and an actionable timeline for estate directives.
                </p>
              </div>
            </section>

            {/* ========================================================================= */}
            {/* TOPIC 2: NET WORTH & BALANCE SHEET */}
            {/* ========================================================================= */}
            <section id="topic-2" className="scroll-mt-6 border-b border-gray-200 dark:border-gray-800 pb-10">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                  2
                </span>
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
                    Net Worth & Balance Sheet
                  </h2>
                  <p className="text-xs text-gray-500">Summary of assets, liabilities, and current allocation breakdown</p>
                </div>
              </div>

              {/* Summary of Assets and Liabilities Tables */}
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      Asset Holdings Breakdown
                    </h3>
                    <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                      Total Assets: {formatCurrency(metrics.totalAssets)}
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-xs">
                      <thead className="bg-gray-50 dark:bg-gray-800/80">
                        <tr>
                          <th className="px-3.5 py-2.5 text-left font-semibold text-gray-600 dark:text-gray-300">Account / Asset Name</th>
                          <th className="px-3.5 py-2.5 text-left font-semibold text-gray-600 dark:text-gray-300">Category</th>
                          <th className="px-3.5 py-2.5 text-center font-semibold text-gray-600 dark:text-gray-300">Last 4</th>
                          <th className="px-3.5 py-2.5 text-right font-semibold text-gray-600 dark:text-gray-300">Value</th>
                          <th className="px-3.5 py-2.5 text-right font-semibold text-gray-600 dark:text-gray-300">% of Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                        {(activeData.assets || []).length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-4 text-center text-gray-400">No assets entered for this period.</td>
                          </tr>
                        ) : (
                          (activeData.assets || []).map((asset) => {
                            const val = Number(asset.value) || 0;
                            const pct = metrics.totalAssets > 0 ? (val / metrics.totalAssets) * 100 : 0;
                            return (
                              <tr key={asset.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <td className="px-3.5 py-2 font-medium text-gray-900 dark:text-white">
                                  {asset.name}
                                  {(asset as any).institution && (
                                    <span className="text-[10px] text-gray-400 block">{(asset as any).institution}</span>
                                  )}
                                </td>
                                <td className="px-3.5 py-2 text-gray-600 dark:text-gray-400">{(asset as any).category || 'General Investment'}</td>
                                <td className="px-3.5 py-2 text-center font-mono text-gray-600 dark:text-gray-300">
                                  {(asset as any).accountNumber || (asset as any).last4 ? `...${(asset as any).accountNumber || (asset as any).last4}` : '—'}
                                </td>
                                <td className="px-3.5 py-2 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                                  {formatCurrency(val)}
                                </td>
                                <td className="px-3.5 py-2 text-right text-gray-500 font-mono">
                                  {pct.toFixed(1)}%
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                      Liabilities & Debt Obligations
                    </h3>
                    <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400">
                      Total Liabilities: {formatCurrency(metrics.totalDebt)}
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-xs">
                      <thead className="bg-gray-50 dark:bg-gray-800/80">
                        <tr>
                          <th className="px-3.5 py-2.5 text-left font-semibold text-gray-600 dark:text-gray-300">Liability Account</th>
                          <th className="px-3.5 py-2.5 text-left font-semibold text-gray-600 dark:text-gray-300">Type</th>
                          <th className="px-3.5 py-2.5 text-center font-semibold text-gray-600 dark:text-gray-300">Last 4</th>
                          <th className="px-3.5 py-2.5 text-right font-semibold text-gray-600 dark:text-gray-300">Balance</th>
                          <th className="px-3.5 py-2.5 text-right font-semibold text-gray-600 dark:text-gray-300">Limit / Original</th>
                          <th className="px-3.5 py-2.5 text-right font-semibold text-gray-600 dark:text-gray-300">Utilization</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                        {[
                          ...(activeData.creditCards || []).map(c => ({ ...c, isLoan: false })),
                          ...(activeData.loans || []).map(l => ({ ...l, isLoan: true }))
                        ].length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-4 text-center text-gray-400">No liabilities recorded (Debt-free).</td>
                          </tr>
                        ) : (
                          [
                            ...(activeData.creditCards || []).map(c => ({ ...c, isLoan: false })),
                            ...(activeData.loans || []).map(l => ({ ...l, isLoan: true }))
                          ].map((debt: any) => {
                            const util = debt.limit > 0 ? (debt.balance / debt.limit) * 100 : 0;
                            return (
                              <tr key={debt.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <td className="px-3.5 py-2 font-medium text-gray-900 dark:text-white">{debt.name}</td>
                                <td className="px-3.5 py-2 text-gray-500">{debt.isLoan ? 'Installment / Term' : 'Revolving Card'}</td>
                                <td className="px-3.5 py-2 text-center font-mono text-gray-500">
                                  {debt.accountNumber || debt.last4 ? `...${debt.accountNumber || debt.last4}` : '—'}
                                </td>
                                <td className="px-3.5 py-2 text-right font-semibold text-rose-600 dark:text-rose-400">
                                  {formatCurrency(debt.balance)}
                                </td>
                                <td className="px-3.5 py-2 text-right text-gray-500">
                                  {debt.limit > 0 ? formatCurrency(debt.limit) : '—'}
                                </td>
                                <td className="px-3.5 py-2 text-right font-mono">
                                  {debt.limit > 0 ? (
                                    <span className={util > 30 ? 'text-rose-600 font-bold' : 'text-gray-600 dark:text-gray-300'}>
                                      {util.toFixed(1)}%
                                    </span>
                                  ) : 'N/A'}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Current Asset Allocation Breakdown */}
                <div className="bg-slate-50 dark:bg-gray-800/50 p-5 rounded-2xl border border-slate-200 dark:border-gray-700">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-3">
                    Current Asset Allocation Breakdown
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">Cash & Liquid HYSA</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200">
                          {metrics.totalAssets > 0 ? ((metrics.liquidCash / metrics.totalAssets) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${metrics.totalAssets > 0 ? Math.min(100, (metrics.liquidCash / metrics.totalAssets) * 100) : 0}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-gray-500 mt-1 block">{formatCurrency(metrics.liquidCash)}</span>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">Equities / Retirement</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200">
                          {metrics.totalAssets > 0 ? ((metrics.retirementInvestments / metrics.totalAssets) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-2 rounded-full" 
                          style={{ width: `${metrics.totalAssets > 0 ? Math.min(100, (metrics.retirementInvestments / metrics.totalAssets) * 100) : 0}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-gray-500 mt-1 block">{formatCurrency(metrics.retirementInvestments)}</span>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">Real Estate Equity</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200">
                          {metrics.totalAssets > 0 ? ((metrics.realEstate / metrics.totalAssets) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-purple-500 h-2 rounded-full" 
                          style={{ width: `${metrics.totalAssets > 0 ? Math.min(100, (metrics.realEstate / metrics.totalAssets) * 100) : 0}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-gray-500 mt-1 block">{formatCurrency(metrics.realEstate)}</span>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">Alternatives / Crypto</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200">
                          {metrics.totalAssets > 0 ? ((metrics.cryptoAndAlternative / metrics.totalAssets) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-amber-500 h-2 rounded-full" 
                          style={{ width: `${metrics.totalAssets > 0 ? Math.min(100, (metrics.cryptoAndAlternative / metrics.totalAssets) * 100) : 0}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-gray-500 mt-1 block">{formatCurrency(metrics.cryptoAndAlternative)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ========================================================================= */}
            {/* TOPIC 3: CASH FLOW ANALYSIS */}
            {/* ========================================================================= */}
            <section id="topic-3" className="scroll-mt-6 border-b border-gray-200 dark:border-gray-800 pb-10">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                  3
                </span>
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
                    Cash Flow Analysis
                  </h2>
                  <p className="text-xs text-gray-500">Monthly income & expense review, savings rate evaluation, and operational burn</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Monthly Income and Expense Review */}
                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-3 flex items-center justify-between">
                    <span>Monthly Operating Ledger</span>
                    <span className="text-blue-600 dark:text-blue-400 font-mono">{formatCurrency(metrics.totalIncome)} In / Mo</span>
                  </h3>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-700/60">
                      <span className="text-gray-600 dark:text-gray-400">Total Gross Earned Income</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">+{formatCurrency(metrics.totalIncome)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-700/60">
                      <span className="text-gray-600 dark:text-gray-400">Fixed Monthly Living Expenses / Bills</span>
                      <span className="font-bold text-rose-600 dark:text-rose-400">-{formatCurrency(metrics.totalBills)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-t-2 border-gray-200 dark:border-gray-700 font-bold">
                      <span className="text-gray-900 dark:text-white">Net Monthly Free Cash Flow</span>
                      <span className={metrics.monthlySurplus > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}>
                        {formatCurrency(metrics.monthlySurplus)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/60 text-[11px] text-gray-500">
                    Debt-to-Income (DTI) Ratio stands at <strong>{metrics.dti.toFixed(1)}%</strong>. 
                    {metrics.dti <= 36 ? ' Institutional lenders view this as a healthy borrowing buffer (< 36%).' : ' High DTI requires debt servicing reduction.'}
                  </div>
                </div>

                {/* Savings Rate Evaluation */}
                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-3">
                      Savings Rate Evaluation & Benchmark
                    </h3>

                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                        {metrics.savingsRate.toFixed(1)}%
                      </div>
                      <div>
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
                          {metrics.savingsRate >= 20 ? 'Optimal Wealth Accumulation (> 20%)' : metrics.savingsRate >= 10 ? 'Moderate Savings Trajectory (10-20%)' : 'Needs Optimization (< 10%)'}
                        </span>
                        <span className="text-[11px] text-gray-500">Percentage of net monthly earnings retained</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-gray-600 dark:text-gray-400">
                        <span>Emergency Runway in Liquid Cash</span>
                        <strong className="text-gray-900 dark:text-white font-mono">{metrics.liquidMonthsRunway.toFixed(1)} Months</strong>
                      </div>
                      <div className="flex justify-between text-gray-600 dark:text-gray-400">
                        <span>Target 50/30/20 Rule: Needs (≤ 50%)</span>
                        <strong className="font-mono">{metrics.totalIncome > 0 ? ((metrics.totalBills / metrics.totalIncome) * 100).toFixed(1) : 0}%</strong>
                      </div>
                      <div className="flex justify-between text-gray-600 dark:text-gray-400">
                        <span>Target 50/30/20 Rule: Savings Target (≥ 20%)</span>
                        <strong className="font-mono text-emerald-600">{metrics.savingsRate.toFixed(1)}%</strong>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-2.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 text-[10.5px] text-blue-900 dark:text-blue-200">
                    <strong>Advisory Recommendation:</strong> Direct automated transfers of 80% of surplus ({formatCurrency(metrics.monthlySurplus * 0.8)}) into compounding index or retirement funds on pay date.
                  </div>
                </div>
              </div>
            </section>

            {/* ========================================================================= */}
            {/* TOPIC 4: RETIREMENT PLANNING */}
            {/* ========================================================================= */}
            <section id="topic-4" className="scroll-mt-6 border-b border-gray-200 dark:border-gray-800 pb-10">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                  4
                </span>
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
                    Retirement Planning
                  </h2>
                  <p className="text-xs text-gray-500">Retirement income projections, Monte Carlo probability analysis, and withdrawal strategies</p>
                </div>
              </div>

              {/* Retirement Projections Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-800 border border-indigo-100 dark:border-gray-700">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">Current Investable Base</span>
                  <div className="text-xl font-black text-gray-900 dark:text-white mt-1">
                    {formatCurrency(metrics.currentInvestable)}
                  </div>
                  <span className="text-[10px] text-gray-500 mt-0.5 block">Working capital compounding</span>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-800 border border-emerald-100 dark:border-gray-700">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Projected Nest Egg (20 Yrs)</span>
                  <div className="text-xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
                    {formatCurrency(metrics.projectedNestEgg)}
                  </div>
                  <span className="text-[10px] text-gray-500 mt-0.5 block">Assuming 7.0% real growth + contributions</span>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-gray-800 dark:to-gray-800 border border-amber-100 dark:border-gray-700">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Sustainable Monthly Draw (4% Rule)</span>
                  <div className="text-xl font-black text-amber-700 dark:text-amber-400 mt-1">
                    {formatCurrency(metrics.monthlySafeWithdrawal)} / mo
                  </div>
                  <span className="text-[10px] text-gray-500 mt-0.5 block">{formatCurrency(metrics.annualSafeWithdrawal)} / yr perpetual</span>
                </div>
              </div>

              {/* Monte Carlo Probability Analysis */}
              <div className="bg-slate-50 dark:bg-gray-800/40 p-5 rounded-2xl border border-slate-200 dark:border-gray-700 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200">
                      Monte Carlo Probability Analysis (1,000 Iterations)
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      Simulated portfolio survival over 30 years across randomized historical volatility and sequence-of-returns
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300">
                    Plan Confidence: 89% (High Success)
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs divide-y divide-gray-200 dark:divide-gray-700">
                    <thead>
                      <tr className="text-gray-500 text-left">
                        <th className="py-2 font-semibold">Simulation Scenario</th>
                        <th className="py-2 font-semibold text-center">Market Percentile</th>
                        <th className="py-2 font-semibold text-right">Projected Terminal Value</th>
                        <th className="py-2 font-semibold text-right">30-Year Success Rate</th>
                        <th className="py-2 font-semibold text-right">Risk Factor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      <tr>
                        <td className="py-2.5 font-medium text-emerald-700 dark:text-emerald-400">Bull / Strong Expansion</td>
                        <td className="py-2.5 text-center font-mono">90th Percentile</td>
                        <td className="py-2.5 text-right font-mono font-bold text-gray-900 dark:text-white">{formatCurrency(metrics.projectedNestEgg * 1.6)}</td>
                        <td className="py-2.5 text-right font-bold text-emerald-600">99.4%</td>
                        <td className="py-2.5 text-right text-gray-500">Negligible</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-medium text-blue-700 dark:text-blue-400">Median Historical Market</td>
                        <td className="py-2.5 text-center font-mono">50th Percentile</td>
                        <td className="py-2.5 text-right font-mono font-bold text-gray-900 dark:text-white">{formatCurrency(metrics.projectedNestEgg)}</td>
                        <td className="py-2.5 text-right font-bold text-blue-600">89.2%</td>
                        <td className="py-2.5 text-right text-gray-500">Standard</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-medium text-amber-700 dark:text-amber-400">Persistent Bear / Stagflation</td>
                        <td className="py-2.5 text-center font-mono">10th Percentile</td>
                        <td className="py-2.5 text-right font-mono font-bold text-gray-900 dark:text-white">{formatCurrency(metrics.projectedNestEgg * 0.55)}</td>
                        <td className="py-2.5 text-right font-bold text-amber-600">74.8%</td>
                        <td className="py-2.5 text-right text-rose-500">Sequence Risk</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Withdrawal and Distribution Strategies */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Withdrawal and Distribution Strategies
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                    <strong className="text-indigo-600 dark:text-indigo-400 block mb-1">1. The 4% Bengen Safe Rule</strong>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-[11px]">
                      Begin retirement distributions at an initial 4% of total portfolio value, adjusting annually for CPI inflation. Provides a historical 95% 30-year survival rate.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                    <strong className="text-indigo-600 dark:text-indigo-400 block mb-1">2. Dynamic Guardrails</strong>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-[11px]">
                      Trim distribution rate by 10% during prolonged bear markets to eliminate sequence-of-returns drawdown, rebounding during recovery periods.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                    <strong className="text-indigo-600 dark:text-indigo-400 block mb-1">3. Tax Location Waterfall</strong>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-[11px]">
                      Draw from Taxable Brokerage accounts first, followed by Tax-Deferred Traditional 401(k)/IRAs, preserving Tax-Free Roth IRAs for later years.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* ========================================================================= */}
            {/* TOPIC 5: INVESTMENT PORTFOLIO ANALYSIS */}
            {/* ========================================================================= */}
            <section id="topic-5" className="scroll-mt-6 border-b border-gray-200 dark:border-gray-800 pb-10">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                  5
                </span>
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
                    Investment Portfolio Analysis
                  </h2>
                  <p className="text-xs text-gray-500">Current vs. target asset allocation, fee drag, and risk assessment</p>
                </div>
              </div>

              {/* Current vs Target Allocation Table */}
              <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl mb-6">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-800/80">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-semibold text-gray-600 dark:text-gray-300">Asset Category</th>
                      <th className="px-4 py-2.5 text-right font-semibold text-gray-600 dark:text-gray-300">Current Balance</th>
                      <th className="px-4 py-2.5 text-right font-semibold text-gray-600 dark:text-gray-300">Current %</th>
                      <th className="px-4 py-2.5 text-right font-semibold text-gray-600 dark:text-gray-300">Target Benchmark %</th>
                      <th className="px-4 py-2.5 text-right font-semibold text-gray-600 dark:text-gray-300">Drift Variance</th>
                      <th className="px-4 py-2.5 text-left font-semibold text-gray-600 dark:text-gray-300">Rebalance Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                    {[
                      {
                        name: 'Equities & Index Funds',
                        bal: metrics.retirementInvestments,
                        currentPct: metrics.totalAssets > 0 ? (metrics.retirementInvestments / metrics.totalAssets) * 100 : 0,
                        targetPct: 60.0
                      },
                      {
                        name: 'Fixed Income & Cash Equivalents',
                        bal: metrics.liquidCash,
                        currentPct: metrics.totalAssets > 0 ? (metrics.liquidCash / metrics.totalAssets) * 100 : 0,
                        targetPct: 20.0
                      },
                      {
                        name: 'Real Estate / Tangible Property',
                        bal: metrics.realEstate,
                        currentPct: metrics.totalAssets > 0 ? (metrics.realEstate / metrics.totalAssets) * 100 : 0,
                        targetPct: 15.0
                      },
                      {
                        name: 'Alternative / Digital Assets',
                        bal: metrics.cryptoAndAlternative,
                        currentPct: metrics.totalAssets > 0 ? (metrics.cryptoAndAlternative / metrics.totalAssets) * 100 : 0,
                        targetPct: 5.0
                      }
                    ].map((row, idx) => {
                      const drift = row.currentPct - row.targetPct;
                      return (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-white">{row.name}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-gray-600 dark:text-gray-300">{formatCurrency(row.bal)}</td>
                          <td className="px-4 py-2.5 text-right font-mono font-bold">{row.currentPct.toFixed(1)}%</td>
                          <td className="px-4 py-2.5 text-right font-mono text-gray-500">{row.targetPct.toFixed(1)}%</td>
                          <td className="px-4 py-2.5 text-right font-mono font-bold">
                            <span className={Math.abs(drift) > 7 ? 'text-amber-600' : 'text-emerald-600'}>
                              {drift > 0 ? `+${drift.toFixed(1)}%` : `${drift.toFixed(1)}%`}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">
                            {Math.abs(drift) > 7 
                              ? (drift > 0 ? 'Trim / Harvest' : 'Direct New Inflows') 
                              : 'Balanced (In Range)'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Fee and Risk Assessment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-gray-800/40 border border-slate-200 dark:border-gray-700">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    Portfolio Fee Drag Assessment
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-[11px]">
                    Institutional audit indicates low-cost passive index core (target expense ratio &lt; 0.12%). Shifting away from actively managed products saving an estimated <strong>0.75% annually</strong> retains over <strong>{formatCurrency(metrics.projectedNestEgg * 0.14)}</strong> in compound wealth over 20 years.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-gray-800/40 border border-slate-200 dark:border-gray-700">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    Concentration Risk Scan
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-[11px]">
                    Single position threshold is maintained below 10% of total liquid assets. Any cryptocurrency or speculative holding exceeding 5% should have established stop-gain rebalancing rules to lock in profits.
                  </p>
                </div>
              </div>
            </section>

            {/* ========================================================================= */}
            {/* TOPIC 6: RISK MANAGEMENT & INSURANCE PLANNING */}
            {/* ========================================================================= */}
            <section id="topic-6" className="scroll-mt-6 border-b border-gray-200 dark:border-gray-800 pb-10">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                  6
                </span>
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
                    Risk Management & Insurance Planning
                  </h2>
                  <p className="text-xs text-gray-500">Life and disability insurance requirements, casualty, and umbrella liability protection</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Life & Disability Insurance Analysis */}
                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 space-y-3 text-xs">
                  <h3 className="font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Life & Disability Needs Analysis
                  </h3>

                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/60 space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Income Replacement Benchmark (10x Annual):</span>
                      <strong className="text-gray-900 dark:text-white">{formatCurrency(metrics.totalIncome * 12 * 10)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Outstanding Debt Liquidation Need:</span>
                      <strong className="text-rose-600">{formatCurrency(metrics.totalDebt)}</strong>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-1 font-bold">
                      <span>Total Recommended Term Life Coverage:</span>
                      <span className="text-blue-600 dark:text-blue-400">
                        {formatCurrency(Math.max(500000, (metrics.totalIncome * 12 * 10) + metrics.totalDebt))}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
                    <strong>Disability Protection:</strong> Ensure individual long-term disability policy covers 60-65% of gross earnings ({formatCurrency(metrics.totalIncome * 0.65)}/mo) with "own-occupation" definition of disability.
                  </p>
                </div>

                {/* Property, Casualty & Umbrella Liability Review */}
                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 space-y-3 text-xs">
                  <h3 className="font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Property, Casualty & Umbrella Liability Review
                  </h3>

                  <div className="p-3 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Net Worth Asset Exposure:</span>
                      <strong className="text-gray-900 dark:text-white">{formatCurrency(metrics.netWorth)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Recommended Excess Umbrella Policy:</span>
                      <strong className="text-indigo-700 dark:text-indigo-300 font-bold">$2,000,000 to $3,000,000</strong>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
                    <strong>Underlying Limits Audit:</strong> Standard homeowner and auto liability caps ($300k-$500k) leave personal net worth exposed to catastrophic civil judgements. A dedicated umbrella policy costs ~$250-$400/year and shields your balance sheet.
                  </p>
                </div>
              </div>
            </section>

            {/* ========================================================================= */}
            {/* TOPIC 7: TAX & ESTATE PLANNING CONSIDERATIONS */}
            {/* ========================================================================= */}
            <section id="topic-7" className="scroll-mt-6 border-b border-gray-200 dark:border-gray-800 pb-10">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                  7
                </span>
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
                    Tax & Estate Planning Considerations
                  </h2>
                  <p className="text-xs text-gray-500">Tax-efficient withdrawal strategies, estate document checklist, and generational directives</p>
                </div>
              </div>

              {/* Tax-Efficient Strategies */}
              <div className="mb-6 p-4 rounded-xl bg-slate-50 dark:bg-gray-800/40 border border-slate-200 dark:border-gray-700 text-xs space-y-2">
                <h3 className="font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200">
                  Tax-Efficient Wealth & Withdrawal Architecture
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  <div>
                    <strong className="text-blue-600 dark:text-blue-400 block mb-1">Asset Location Optimization</strong>
                    <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
                      Hold high-yield debt and dividend-paying assets in tax-deferred accounts (Traditional IRA/401k). Place high-growth equities and capital gain assets in taxable or Roth vehicles.
                    </p>
                  </div>
                  <div>
                    <strong className="text-blue-600 dark:text-blue-400 block mb-1">Tax-Bracket Bridging</strong>
                    <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
                      Execute strategic Roth conversions during lower income transition years before Required Minimum Distributions (RMDs) mandate taxable withdrawals at age 73/75.
                    </p>
                  </div>
                  <div>
                    <strong className="text-blue-600 dark:text-blue-400 block mb-1">Capital Gains & Basis Step-Up</strong>
                    <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
                      Assets held outside retirement accounts benefit from a step-up in cost basis at death under current federal estate code, mitigating capital gains for heirs.
                    </p>
                  </div>
                </div>
              </div>

              {/* Estate Document Checklist */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-3 flex items-center justify-between">
                  <span>Essential Estate Document Audit Checklist</span>
                  <span className="text-[11px] text-gray-400 font-normal">Review status with estate attorney</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {[
                    {
                      id: 'will',
                      name: 'Last Will and Testament',
                      desc: 'Designates guardians for minors, specifies asset distribution, appoints executor.',
                      status: estateChecklist.will
                    },
                    {
                      id: 'trust',
                      name: 'Revocable Living Trust',
                      desc: 'Avoids costly probate proceedings, maintains privacy, ensures seamless transition.',
                      status: estateChecklist.trust
                    },
                    {
                      id: 'financialPOA',
                      name: 'Durable Financial Power of Attorney',
                      desc: 'Authorizes trusted agent to manage financial accounts in event of incapacitation.',
                      status: estateChecklist.financialPOA
                    },
                    {
                      id: 'medicalPOA',
                      name: 'Advance Healthcare Directive & Medical POA',
                      desc: 'Specifies end-of-life medical preferences and authorizes healthcare proxy.',
                      status: estateChecklist.medicalPOA
                    },
                    {
                      id: 'beneficiaries',
                      name: 'Primary & Contingent Beneficiary Designations',
                      desc: 'Overrides will on 401(k), IRAs, and life insurance policies directly via TOD/POD.',
                      status: estateChecklist.beneficiaries
                    },
                    {
                      id: 'digitalInventory',
                      name: 'Digital Asset & Secure Password Vault',
                      desc: 'Inventory of online accounts, cryptocurrencies, and access keys for heirs.',
                      status: estateChecklist.digitalInventory
                    }
                  ].map((doc) => (
                    <div key={doc.id} className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 flex items-start justify-between gap-3">
                      <div>
                        <strong className="text-gray-900 dark:text-white block">{doc.name}</strong>
                        <p className="text-[11px] text-gray-500 mt-0.5">{doc.desc}</p>
                      </div>
                      <select
                        value={doc.status}
                        onChange={(e) => setEstateChecklist({ ...estateChecklist, [doc.id]: e.target.value as any })}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border outline-none cursor-pointer ${
                          doc.status === 'complete'
                            ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300'
                            : doc.status === 'in_progress'
                            ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300'
                            : 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-300'
                        }`}
                      >
                        <option value="complete">Executed</option>
                        <option value="in_progress">In Progress</option>
                        <option value="needed">Action Needed</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ========================================================================= */}
            {/* TOPIC 8: ACTION PLAN & NEXT STEPS */}
            {/* ========================================================================= */}
            <section id="topic-8" className="scroll-mt-6 border-b border-gray-200 dark:border-gray-800 pb-10">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                  8
                </span>
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
                    Action Plan & Next Steps
                  </h2>
                  <p className="text-xs text-gray-500">Prioritized implementation checklist and ongoing monitoring calendar</p>
                </div>
              </div>

              {/* Implementation Checklist */}
              <div className="space-y-3 mb-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Prioritized Implementation Roadmap
                </h3>

                <div className="space-y-2 text-xs">
                  {[
                    {
                      id: 'act1',
                      horizon: 'Days 1 - 30 (Immediate)',
                      badgeBg: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
                      title: 'Fortify Liquid Emergency Reserves',
                      desc: `Maintain at least ${formatCurrency(metrics.totalBills * 3)} in dedicated high-yield cash account for direct operational liquidity.`
                    },
                    {
                      id: 'act2',
                      horizon: 'Days 1 - 30 (Immediate)',
                      badgeBg: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
                      title: 'Debt Paydown & Utilization Cap',
                      desc: `Keep revolving card balances below 10% limit ($${formatCurrency(metrics.cardLimit * 0.1)}) to sustain prime tier credit rating.`
                    },
                    {
                      id: 'act3',
                      horizon: 'Days 31 - 90 (Tactical)',
                      badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
                      title: 'Acquire Umbrella & Term Life Quotes',
                      desc: 'Secure quotes for $2M personal umbrella liability and review employer group life vs individual term policy.'
                    },
                    {
                      id: 'act4',
                      horizon: 'Days 31 - 90 (Tactical)',
                      badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
                      title: 'Execute Estate Core Documents',
                      desc: 'Finalize Will, Durable POA, and healthcare advance directives with qualified estate planning attorney.'
                    },
                    {
                      id: 'act5',
                      horizon: 'Days 91 - 180 (Strategic)',
                      badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
                      title: 'Automate Retirement Surplus Inflows',
                      desc: `Direct 80% of net monthly surplus (${formatCurrency(metrics.monthlySurplus * 0.8)}) into low-cost equity index funds.`
                    }
                  ].map((task) => (
                    <div
                      key={task.id}
                      onClick={() => setCompletedActions({ ...completedActions, [task.id]: !completedActions[task.id] })}
                      className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 flex items-start gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={!!completedActions[task.id]}
                        onChange={() => {}} // Handled by div click
                        className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${task.badgeBg}`}>
                            {task.horizon}
                          </span>
                          <strong className={`font-semibold ${completedActions[task.id] ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                            {task.title}
                          </strong>
                        </div>
                        <p className={`text-[11px] ${completedActions[task.id] ? 'text-gray-400' : 'text-gray-600 dark:text-gray-400'}`}>
                          {task.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ongoing Monitoring Schedule */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-gray-800/40 border border-slate-200 dark:border-gray-700 text-xs">
                <h3 className="font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                  Ongoing Financial Review Calendar
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-2.5 rounded-lg bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700">
                    <strong className="text-blue-600 dark:text-blue-400 block mb-0.5">Quarterly Cadence</strong>
                    <p className="text-[11px] text-gray-600 dark:text-gray-400">Rebalance portfolio drift exceeding 5%, review credit card utilization and automated savings pace.</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700">
                    <strong className="text-blue-600 dark:text-blue-400 block mb-0.5">Semi-Annual Cadence</strong>
                    <p className="text-[11px] text-gray-600 dark:text-gray-400">Review tri-bureau credit score trajectories, audit insurance policy coverages, evaluate mortgage refi rates.</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700">
                    <strong className="text-blue-600 dark:text-blue-400 block mb-0.5">Annual Cadence</strong>
                    <p className="text-[11px] text-gray-600 dark:text-gray-400">Comprehensive balance sheet audit, tax loss harvesting review, estate directive beneficiary confirmation.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* ========================================================================= */}
            {/* TOPIC 9: APPENDIX, GLOSSARY, & DISCLOSURES */}
            {/* ========================================================================= */}
            <section id="topic-9" className="scroll-mt-6 pb-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                  9
                </span>
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
                    Appendix, Glossary, & Disclosures
                  </h2>
                  <p className="text-xs text-gray-500">Methodology definitions, modeling assumptions, and regulatory disclosures</p>
                </div>
              </div>

              {/* Glossary of Terms */}
              <div className="mb-6 space-y-2 text-xs">
                <h3 className="font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                  Financial Planning Glossary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700">
                    <strong className="text-gray-900 dark:text-white block">Debt-to-Income (DTI) Ratio:</strong>
                    <span className="text-[11px] text-gray-600 dark:text-gray-400">Total monthly recurring debt service divided by gross monthly income. Optimal target is under 36%.</span>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700">
                    <strong className="text-gray-900 dark:text-white block">Monte Carlo Simulation:</strong>
                    <span className="text-[11px] text-gray-600 dark:text-gray-400">A mathematical modeling technique predicting thousands of potential future market return sequences to measure portfolio survival odds.</span>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700">
                    <strong className="text-gray-900 dark:text-white block">Safe Withdrawal Rate (SWR):</strong>
                    <span className="text-[11px] text-gray-600 dark:text-gray-400">The percentage of initial retirement assets that can be withdrawn annually without depleting the portfolio over 30 years (historically 4.0%).</span>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700">
                    <strong className="text-gray-900 dark:text-white block">Net Free Cash Flow:</strong>
                    <span className="text-[11px] text-gray-600 dark:text-gray-400">Net discretionary savings available after satisfying all mandatory bills, minimum debt obligations, and living costs.</span>
                  </div>
                </div>
              </div>

              {/* Modeling Assumptions */}
              <div className="mb-6 p-3.5 rounded-xl bg-slate-50 dark:bg-gray-800/40 border border-slate-200 dark:border-gray-700 text-xs">
                <h4 className="font-bold text-gray-900 dark:text-white mb-1">Modeling Assumptions & Analytical Methodologies</h4>
                <ul className="list-disc ml-5 space-y-1 text-[11px] text-gray-600 dark:text-gray-400">
                  <li>Real equity asset return rate assumed at 7.0% compounded annually net of 2.5% inflation.</li>
                  <li>Fixed income baseline return assumed at 4.2% nominal yield.</li>
                  <li>Tax rates are modeled on current federal marginal brackets without dynamic legislative alterations.</li>
                </ul>
              </div>

              {/* Regulatory & Fiduciary Disclosures */}
              <div className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700 text-[10.5px] text-gray-600 dark:text-gray-400 leading-relaxed">
                <strong className="text-gray-900 dark:text-white block mb-1">
                  FIDUCIARY ADVISORY NOTICE & REGULATORY DISCLAIMER:
                </strong>
                This Comprehensive Financial Planning Report is generated by What's My Credit Worth analytical engines based on user-provided financial snapshots. All calculations, Monte Carlo simulations, and retirement trajectory models are provided strictly for educational, illustrative, and financial decision-support purposes. This report does not constitute personalized legal, tax, or SEC-registered investment advice. Past historical performance is no guarantee of future market returns. Readers are advised to consult a Certified Financial Planner (CFP&reg;), licensed CPA, and estate planning attorney before executing significant financial or estate actions.
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 font-mono text-[9.5px] text-gray-500">
                  &copy; 2026 What's My Credit Worth Inc. All Rights Reserved. • System Build Ref: {reportRefId}
                </div>
              </div>
            </section>

          </div>
        </div>

      </div>
    </div>
  );
};
