
import React, { useState } from 'react';
import type { MonthlyData, FinancialData } from '../types';
import { 
  calculateNetWorth, 
  calculateTotal, 
  calculateTotalBalance, 
  calculateTotalLimit, 
  calculateUtilization, 
  formatCurrency, 
  getUtilizationColor, 
  calculateMonthlyIncome, 
  calculateDTI, 
  formatExternalUrl, 
  getDisplayUrl,
  calculateTotalCoverage,
  calculateTotalMonthlyInsuranceCost
} from '../utils/helpers';
import Card from './ui/Card';
import Metric from './ui/Metric';
import NetWorthChart from './charts/NetWorthChart';
import CreditScoreChart from './charts/CreditScoreChart';
import SimulationModal from './SimulationModal';
import MembershipModal from './MembershipModal';
import CalculationImageModal, { CalculationMetricType } from './CalculationImageModal';
import { SimulationIcon, GoldAsterisk } from './ui/Icons';
import { useAuth } from '../contexts/AuthContext';
import FinancialFreedomSteps from './FinancialFreedomSteps';

interface DashboardProps {
  data?: MonthlyData;
  allData: FinancialData;
  monthYear: string;
  onNextStepsSync?: () => void;
  onEdit?: () => void;
  onOpenLinkedAccounts?: () => void;
}

const ProgressBar: React.FC<{ value: number }> = ({ value }) => {
  const utilization = Math.min(Math.max(value, 0), 100);
  const colorClass = utilization > 70 ? 'bg-red-500' : utilization > 30 ? 'bg-yellow-500' : 'bg-green-500';
  return <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5"><div className={`${colorClass} h-2.5 rounded-full`} style={{ width: `${utilization}%` }}></div></div>;
};

const Dashboard: React.FC<DashboardProps> = ({ data, allData, monthYear, onNextStepsSync, onEdit, onOpenLinkedAccounts }) => {
  const [chartView, setChartView] = useState<'netWorth' | 'creditScores'>('netWorth');
  const [liabilityView, setLiabilityView] = useState<'cards' | 'loans'>('cards');
  const [isSimulationOpen, setIsSimulationOpen] = useState(false);
  const [isMembershipOpen, setIsMembershipOpen] = useState(false);
  const [selectedCalcMetric, setSelectedCalcMetric] = useState<CalculationMetricType | null>(null);
  const { isPremium, accountType, businessName } = useAuth();

  if (!data) return <div className="text-center py-10"><h2 className="text-xl font-semibold">No data available.</h2></div>;

  const handleSimulationClick = () => {
    if (isPremium) setIsSimulationOpen(true);
    else setIsMembershipOpen(true);
  };

  const netWorth = calculateNetWorth(data);
  const totalIncome = calculateMonthlyIncome(data.income.jobs);
  const totalBills = calculateTotal(data.monthlyBills);
  const totalAssets = calculateTotal(data.assets);
  const totalDebt = calculateTotalBalance(data.creditCards) + calculateTotalBalance(data.loans);
  
  const totalCardUtilization = calculateUtilization(calculateTotalBalance(data.creditCards), calculateTotalLimit(data.creditCards));
  const totalLoanUtilization = calculateUtilization(calculateTotalBalance(data.loans), calculateTotalLimit(data.loans));
  
  const dti = calculateDTI(totalBills, totalIncome);
  
  const ChartSwitcher = (
    <div className="flex items-center gap-4">
        {['netWorth', 'creditScores'].map((view) => (
          <button
            key={view}
            onClick={() => setChartView(view as any)}
            className={`text-lg font-semibold pb-1 border-b-2 transition-colors ${chartView === view ? 'text-brand-primary border-brand-primary' : 'text-gray-500 border-transparent hover:text-brand-primary'}`}
          >
            {view === 'netWorth' ? 'Net Worth Over Time' : 'Credit Scores Over Time'}
          </button>
        ))}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            <Metric 
              label="Net Worth" 
              value={formatCurrency(netWorth)} 
              change={netWorth > 0 ? 'positive' : 'negative'} 
              onClick={() => setSelectedCalcMetric('NET WORTH')}
              clickHint="Click to view Net Worth calculation image & user inputs"
            />
            <Metric 
              label="Total Assets" 
              value={formatCurrency(totalAssets)} 
              onClick={() => setSelectedCalcMetric('TOTAL ASSETS')}
              clickHint="Click to view Total Assets calculation image & user inputs"
            />
            <Metric 
              label="Total Debt" 
              value={formatCurrency(totalDebt)} 
              change="negative" 
              onClick={() => setSelectedCalcMetric('TOTAL DEBT')}
              clickHint="Click to view Total Debt calculation image & user inputs"
            />
            <Metric 
              label="Monthly Income" 
              value={formatCurrency(totalIncome)} 
              change="positive" 
              onClick={() => setSelectedCalcMetric('MONTHLY INCOME')}
              clickHint="Click to view Monthly Income calculation image & user inputs"
            />
            <Metric 
              label="DTI Ratio" 
              value={`${dti.toFixed(2)}%`} 
              change={dti <= 36 ? 'positive' : dti > 43 ? 'negative' : undefined} 
              onClick={() => setSelectedCalcMetric('DTI RATIO')}
              clickHint="Click to view DTI Ratio calculation image & user inputs"
            />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <Card title={ChartSwitcher}>
                    <div className="h-80">
                        {chartView === 'netWorth' ? <NetWorthChart data={allData} /> : <CreditScoreChart data={allData} />}
                    </div>
                </Card>
            </div>
            <div>
                 <Card title={<h3 className="text-lg font-semibold text-brand-primary">Credit Scores</h3>}>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <Metric label="Experian FICO 8" value={data?.creditScores?.experian?.score8 || 0} size="small" />
                        <Metric label="Equifax FICO 8" value={data?.creditScores?.equifax?.score8 || 0} size="small" />
                        <Metric label="TransUnion FICO 8" value={data?.creditScores?.transunion?.score8 || 0} size="small" />
                        <Metric label="Auto FICO 8" value={data?.creditScores?.autoFico8 || 0} size="small" />
                        <Metric label="Credit Card FICO 8" value={data?.creditScores?.creditCardFico8 || 0} size="small" />
                        <Metric label={data?.creditScores?.mrCooperLabel || "Mr. Cooper FICO 4"} value={data?.creditScores?.mrCooper || 0} size="small" />
                    </div>
                </Card>
            </div>
        </div>

        <FinancialFreedomSteps monthlyIncome={totalIncome} />

        {/* Multi-Account Hub: Spouse & Business Linking Quick Bar */}
        <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-purple-50/80 dark:from-gray-800 dark:to-gray-800/80 p-3.5 rounded-2xl border border-indigo-100 dark:border-gray-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-sm font-bold shrink-0">
              🔗
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-900 dark:text-white">
                  Multi-Account Hub: Spouse &amp; Business Gmail Sync
                </span>
                <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300/40">
                  ⭐ Premium
                </span>
                <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  {accountType === 'business' ? 'Business Mode' : 'Personal Mode'}
                </span>
              </div>
              <p className="text-[11px] text-gray-600 dark:text-gray-400">
                Link data from spouse's Gmail or business account, inspect joint household numbers, or merge accounts into your {accountType === 'business' ? (businessName || 'Business') : 'Personal'} Account.
              </p>
            </div>
          </div>
          {onOpenLinkedAccounts && (
            <button
              onClick={() => {
                if (isPremium) {
                  onOpenLinkedAccounts();
                } else {
                  setIsMembershipOpen(true);
                }
              }}
              className="px-3.5 py-1.5 text-xs font-bold bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-indigo-700 dark:text-indigo-300 rounded-xl border border-indigo-200 dark:border-indigo-800 shadow-sm transition-all whitespace-nowrap self-start sm:self-auto flex items-center gap-1.5 shrink-0"
            >
              <span>⚡ Link &amp; Merge Accounts</span>
              <GoldAsterisk className="text-amber-500" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card 
                title={
                    <div className="flex justify-between items-center w-full">
                        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 gap-1">
                             <button
                               onClick={() => setLiabilityView('cards')}
                               className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${liabilityView === 'cards' ? 'bg-white dark:bg-gray-600 shadow text-brand-primary' : 'text-gray-500 dark:text-gray-400'}`}
                            >
                               Credit Cards
                            </button>
                            <button
                               onClick={() => setLiabilityView('loans')}
                               className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${liabilityView === 'loans' ? 'bg-white dark:bg-gray-600 shadow text-brand-secondary' : 'text-gray-500 dark:text-gray-400'}`}
                            >
                               Loans
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {onNextStepsSync && (
                            <button 
                              onClick={onNextStepsSync}
                              className="text-[10px] font-bold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 px-2 py-1.5 rounded-full flex items-center gap-1 transition-all"
                              title="Sync Cards & Loans to Next Steps App"
                            >
                              <svg className="w-3 h-3 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                              </svg>
                              <span>Next Steps Sync</span>
                            </button>
                          )}
                          <button onClick={handleSimulationClick} className="text-[10px] font-bold text-brand-primary bg-brand-light/20 px-2.5 py-1.5 rounded-full flex items-center gap-1 transition-all animate-pulse">
                              <SimulationIcon /> {liabilityView === 'cards' ? 'SIMULATE' : 'PREDICT'} <GoldAsterisk />
                          </button>
                        </div>
                    </div>
                } 
                footerText={`Total Utilization: ${liabilityView === 'cards' ? totalCardUtilization.toFixed(2) : totalLoanUtilization.toFixed(2)}%`}
            >
                <div className="space-y-4">
                {liabilityView === 'cards' ? (
                    data.creditCards.length > 0 ? (
                        data.creditCards.map(card => {
                            const utilization = calculateUtilization(card.balance, card.limit);
                            return (
                                <div key={card.id}>
                                    <div className="flex justify-between items-start mb-1 text-sm gap-2">
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-semibold truncate">{card.name}</span>
                                            {card.url && card.url.trim() && (
                                                <a
                                                    href={formatExternalUrl(card.url)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-normal mt-0.5 truncate max-w-[200px]"
                                                    title={`Open ${card.name} portal`}
                                                >
                                                    <svg className="w-2.5 h-2.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                    <span className="truncate">{getDisplayUrl(card.url)}</span>
                                                    <span className="text-[9px] text-blue-500/70">↗</span>
                                                </a>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-gray-500 text-xs sm:text-sm">{formatCurrency(card.balance)} / {formatCurrency(card.limit)}</span>
                                            <span className={`font-bold text-xs sm:text-sm ${getUtilizationColor(utilization)}`}>{utilization.toFixed(1)}%</span>
                                        </div>
                                    </div>
                                    <ProgressBar value={utilization} />
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-sm text-gray-500 text-center py-4">No credit cards added.</p>
                    )
                ) : (
                    data.loans.length > 0 ? (
                        data.loans.map(loan => {
                            const utilization = calculateUtilization(loan.balance, loan.limit);
                            return (
                                <div key={loan.id}>
                                    <div className="flex justify-between items-start mb-1 text-sm gap-2">
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-semibold truncate">{loan.name}</span>
                                            {loan.url && loan.url.trim() && (
                                                <a
                                                    href={formatExternalUrl(loan.url)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-normal mt-0.5 truncate max-w-[200px]"
                                                    title={`Open ${loan.name} portal`}
                                                >
                                                    <svg className="w-2.5 h-2.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                    <span className="truncate">{getDisplayUrl(loan.url)}</span>
                                                    <span className="text-[9px] text-blue-500/70">↗</span>
                                                </a>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-gray-500 text-xs sm:text-sm">{formatCurrency(loan.balance)} / {formatCurrency(loan.limit)}</span>
                                            <span className={`font-bold text-xs sm:text-sm ${getUtilizationColor(utilization)}`}>{utilization.toFixed(1)}%</span>
                                        </div>
                                    </div>
                                    <ProgressBar value={utilization} />
                                </div>
                            );
                        })
                    ) : (
                         <p className="text-sm text-gray-500 text-center py-4">No loans added.</p>
                    )
                )}
                </div>
            </Card>

            <Card 
                title={<h3 className="text-lg font-semibold text-brand-primary">Assets</h3>}
                footerText={`Total Assets: ${formatCurrency(totalAssets)}`}
            >
                 <div className="space-y-4">
                    {data.assets.length > 0 ? (
                        data.assets.map(asset => (
                            <div key={asset.id} className="mb-2">
                                <div className="flex justify-between items-start mb-1 text-sm gap-2">
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">{asset.name}</span>
                                        {asset.url && asset.url.trim() && (
                                            <a
                                                href={formatExternalUrl(asset.url)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-normal mt-0.5 truncate max-w-[200px]"
                                                title={`Open ${asset.name} portal`}
                                            >
                                                <svg className="w-2.5 h-2.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                                <span className="truncate">{getDisplayUrl(asset.url)}</span>
                                                <span className="text-[9px] text-blue-500/70">↗</span>
                                            </a>
                                        )}
                                    </div>
                                    <span className="font-bold text-positive shrink-0">{formatCurrency(asset.value)}</span>
                                </div>
                                {totalAssets > 0 && (
                                     <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                                        <div 
                                            className="bg-brand-primary h-1.5 rounded-full opacity-70" 
                                            style={{ width: `${Math.min((asset.value / totalAssets) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-gray-500 text-center py-4">No assets added.</p>
                    )}
                </div>
            </Card>

            <Card 
                title={<h3 className="text-lg font-semibold text-brand-primary">Monthly Bills</h3>}
                footerText={`Total Monthly Bills: ${formatCurrency(totalBills)}`}
            >
                 <div className="space-y-4">
                    {data.monthlyBills.length > 0 ? (
                        data.monthlyBills.map(bill => (
                            <div key={bill.id} className="mb-2">
                                <div className="flex justify-between items-start mb-1 text-sm gap-2">
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">{bill.name}</span>
                                        {bill.url && bill.url.trim() && (
                                            <a
                                                href={formatExternalUrl(bill.url)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-normal mt-0.5 truncate max-w-[200px]"
                                                title={`Open ${bill.name} payment portal`}
                                            >
                                                <svg className="w-2.5 h-2.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                                <span className="truncate">{getDisplayUrl(bill.url)}</span>
                                                <span className="text-[9px] text-blue-500/70">↗</span>
                                            </a>
                                        )}
                                    </div>
                                    <span className="font-bold text-amber-600 dark:text-amber-400 shrink-0">{formatCurrency(bill.amount)}</span>
                                </div>
                                {totalBills > 0 && (
                                     <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                                        <div 
                                            className="bg-amber-500 h-1.5 rounded-full opacity-70" 
                                            style={{ width: `${Math.min((bill.amount / totalBills) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-gray-500 text-center py-4">No monthly bills added.</p>
                    )}
                </div>
            </Card>
        </div>

        {/* Term Life Insurance & Wealth Protection Ledger */}
        {(() => {
          const policies = data.termLifeInsurance || [];
          const totalCoverage = calculateTotalCoverage(policies);
          const totalMonthlyCost = calculateTotalMonthlyInsuranceCost(policies);
          const incomeReplacementNeed = (totalIncome * 12 * 10) + totalDebt;
          const protectionCoveragePct = incomeReplacementNeed > 0 ? (totalCoverage / incomeReplacementNeed) * 100 : 0;

          return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/80 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-700/80 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 dark:bg-blue-400/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-lg font-bold shrink-0">
                    🛡️
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <span>Term Life Insurance &amp; Family Protection Portfolio</span>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                        {policies.length} {policies.length === 1 ? 'Policy' : 'Policies'}
                      </span>
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Death benefit capital, policy duration, beneficiaries, and premium schedules shielding your household &amp; enterprise
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {onEdit && (
                    <button
                      onClick={onEdit}
                      className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <span>+ Add / Edit Policies</span>
                    </button>
                  )}
                </div>
              </div>

              {/* High-level Coverage Audit Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200/70 dark:border-gray-700/60">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">Total Death Benefit</span>
                  <span className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400 block mt-0.5">
                    {formatCurrency(totalCoverage)}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200/70 dark:border-gray-700/60">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">Monthly Premium Equivalent</span>
                  <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 block mt-0.5">
                    {formatCurrency(totalMonthlyCost)}/mo
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200/70 dark:border-gray-700/60">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">Debt + 10x Income Benchmark</span>
                  <span className="text-lg font-bold font-mono text-gray-700 dark:text-gray-300 block mt-0.5">
                    {formatCurrency(incomeReplacementNeed)}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200/70 dark:border-gray-700/60">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">Protection Score</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-lg font-bold font-mono ${protectionCoveragePct >= 100 ? 'text-emerald-600 dark:text-emerald-400' : protectionCoveragePct >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                      {protectionCoveragePct.toFixed(0)}%
                    </span>
                    <span className="text-[10px] text-gray-500">of benchmark</span>
                  </div>
                </div>
              </div>

              {/* Policy Table / List */}
              {policies.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-dashed border-gray-200 dark:border-gray-700 space-y-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    No term life policies entered yet for this month.
                  </p>
                  {onEdit && (
                    <button
                      onClick={onEdit}
                      className="px-3.5 py-1.5 bg-brand-primary text-white text-xs font-bold rounded-lg shadow-xs hover:bg-brand-secondary transition-all"
                    >
                      Add Your First Term Life Policy
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {policies.map(policy => (
                    <div
                      key={policy.id}
                      className="p-4 rounded-xl bg-gray-50/70 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/70 hover:border-blue-300 dark:hover:border-blue-800 transition-all space-y-2.5"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                              {policy.policyName}
                            </h4>
                            {policy.isBusiness && (
                              <span className="px-1.5 py-0.2 text-[9px] font-extrabold uppercase rounded bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                                🏢 Commercial
                              </span>
                            )}
                            {policy.status && (
                              <span className={`px-1.5 py-0.2 text-[9px] font-extrabold uppercase rounded ${
                                policy.status === 'active' ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                              }`}>
                                {policy.status}
                              </span>
                            )}
                          </div>
                          {policy.insuranceCompany && (
                            <span className="text-xs text-gray-500 font-medium block mt-0.5">
                              Carrier: {policy.insuranceCompany}
                              {policy.policyNumber && ` • Policy #${policy.policyNumber}`}
                            </span>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-sm font-bold font-mono text-blue-600 dark:text-blue-400 block">
                            {formatCurrency(policy.coverageAmount)}
                          </span>
                          <span className="text-[11px] text-gray-500 font-medium block">
                            {formatCurrency(policy.premiumAmount)} / {policy.premiumFrequency}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-gray-600 dark:text-gray-400 pt-1 border-t border-gray-200/60 dark:border-gray-700/50">
                        <div>
                          <span className="text-gray-400 block text-[10px]">Insured Person:</span>
                          <span className="font-medium text-gray-800 dark:text-gray-200">{policy.insuredPerson || 'Primary'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[10px]">Primary Beneficiary:</span>
                          <span className="font-medium text-gray-800 dark:text-gray-200 truncate block">{policy.beneficiary || 'Spouse / Trust'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[10px]">Term Expiration:</span>
                          <span className="font-medium text-gray-800 dark:text-gray-200">
                            {policy.policyEndDate || `${policy.termLengthYears || 20} Years`}
                          </span>
                        </div>
                      </div>

                      {policy.riders && policy.riders.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1 text-[10px]">
                          {policy.riders.map((r, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-medium border border-blue-200/60 dark:border-blue-800/40">
                              ✓ {r}
                            </span>
                          ))}
                        </div>
                      )}

                      {policy.url && (
                        <div className="pt-1 flex items-center justify-between text-[11px]">
                          <a
                            href={formatExternalUrl(policy.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-medium"
                          >
                            <span>Carrier Online Portal</span>
                            <span className="text-[9px]">↗</span>
                          </a>
                          {policy.notes && (
                            <span className="text-[10px] text-gray-400 truncate max-w-[200px]" title={policy.notes}>
                              {policy.notes}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
        
        <SimulationModal isOpen={isSimulationOpen} onClose={() => setIsSimulationOpen(false)} data={data} monthYear={monthYear} />
        <MembershipModal isOpen={isMembershipOpen} onClose={() => setIsMembershipOpen(false)} />
        {selectedCalcMetric && (
          <CalculationImageModal
            isOpen={Boolean(selectedCalcMetric)}
            onClose={() => setSelectedCalcMetric(null)}
            initialMetric={selectedCalcMetric}
            data={data}
            monthYear={monthYear}
            onOpenEditor={onEdit}
          />
        )}
    </div>
  );
};

export default Dashboard;
