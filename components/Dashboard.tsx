
import React, { useState } from 'react';
import type { MonthlyData, FinancialData } from '../types';
import { calculateNetWorth, calculateTotal, calculateTotalBalance, calculateTotalLimit, calculateUtilization, formatCurrency, getUtilizationColor, calculateMonthlyIncome, calculateDTI } from '../utils/helpers';
import Card from './ui/Card';
import Metric from './ui/Metric';
import NetWorthChart from './charts/NetWorthChart';
import CreditScoreChart from './charts/CreditScoreChart';
import SimulationModal from './SimulationModal';
import MembershipModal from './MembershipModal';
import { SimulationIcon, GoldAsterisk } from './ui/Icons';
import { useAuth } from '../contexts/AuthContext';

interface DashboardProps {
  data?: MonthlyData;
  allData: FinancialData;
  monthYear: string;
}

const ProgressBar: React.FC<{ value: number }> = ({ value }) => {
  const utilization = Math.min(Math.max(value, 0), 100);
  const colorClass = utilization > 70 ? 'bg-red-500' : utilization > 30 ? 'bg-yellow-500' : 'bg-green-500';
  return <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5"><div className={`${colorClass} h-2.5 rounded-full`} style={{ width: `${utilization}%` }}></div></div>;
};

const Dashboard: React.FC<DashboardProps> = ({ data, allData, monthYear }) => {
  const [chartView, setChartView] = useState<'netWorth' | 'creditScores'>('netWorth');
  const [liabilityView, setLiabilityView] = useState<'cards' | 'loans'>('cards');
  const [isSimulationOpen, setIsSimulationOpen] = useState(false);
  const [isMembershipOpen, setIsMembershipOpen] = useState(false);
  const { isPremium } = useAuth();

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
            <Metric label="Net Worth" value={formatCurrency(netWorth)} change={netWorth > 0 ? 'positive' : 'negative'} />
            <Metric label="Total Assets" value={formatCurrency(totalAssets)} />
            <Metric label="Total Debt" value={formatCurrency(totalDebt)} change="negative" />
            <Metric label="Monthly Income" value={formatCurrency(totalIncome)} change="positive" />
            <Metric label="DTI Ratio" value={`${dti.toFixed(2)}%`} change={dti <= 36 ? 'positive' : dti > 43 ? 'negative' : undefined} />
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
                        <Metric label="Mr. Cooper FICO 4" value={data?.creditScores?.mrCooper || 0} size="small" />
                    </div>
                </Card>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                        
                        <button onClick={handleSimulationClick} className="text-[10px] font-bold text-brand-primary bg-brand-light/20 px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all animate-pulse">
                            <SimulationIcon /> {liabilityView === 'cards' ? 'RUN SIMULATION' : 'PREDICT SCORE'} <GoldAsterisk />
                        </button>
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
                                    <div className="flex justify-between items-center mb-1 text-sm">
                                        <span className="font-semibold">{card.name}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-500">{formatCurrency(card.balance)} / {formatCurrency(card.limit)}</span>
                                            <span className={`font-bold ${getUtilizationColor(utilization)}`}>{utilization.toFixed(2)}%</span>
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
                                    <div className="flex justify-between items-center mb-1 text-sm">
                                        <span className="font-semibold">{loan.name}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-500">{formatCurrency(loan.balance)} / {formatCurrency(loan.limit)}</span>
                                            <span className={`font-bold ${getUtilizationColor(utilization)}`}>{utilization.toFixed(2)}%</span>
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
                                <div className="flex justify-between items-center mb-1 text-sm">
                                    <span className="font-semibold text-gray-800 dark:text-gray-200">{asset.name}</span>
                                    <span className="font-bold text-positive">{formatCurrency(asset.value)}</span>
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
        </div>
        
        <SimulationModal isOpen={isSimulationOpen} onClose={() => setIsSimulationOpen(false)} data={data} monthYear={monthYear} />
        <MembershipModal isOpen={isMembershipOpen} onClose={() => setIsMembershipOpen(false)} />
    </div>
  );
};

export default Dashboard;
