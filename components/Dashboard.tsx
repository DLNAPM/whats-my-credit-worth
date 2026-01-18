
import React, { useState } from 'react';
import type { MonthlyData, FinancialData } from '../types';
import { calculateNetWorth, calculateTotal, calculateTotalBalance, calculateTotalLimit, calculateUtilization, formatCurrency, getUtilizationColor, calculateMonthlyIncome, calculateDTI } from '../utils/helpers';
import Card from './ui/Card';
import Metric from './ui/Metric';
import NetWorthChart from './charts/NetWorthChart';
import CreditScoreChart from './charts/CreditScoreChart';
import SimulationModal from './SimulationModal';
import MembershipModal from './MembershipModal';
import { SimulationIcon } from './ui/Icons';
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
                        <Metric label="Experian FICO 8" value={data.creditScores.experian.score8} size="small" />
                        <Metric label="Equifax FICO 8" value={data.creditScores.equifax.score8} size="small" />
                        <Metric label="TransUnion FICO 8" value={data.creditScores.transunion.score8} size="small" />
                        <Metric label="Mr. Cooper FICO 4" value={data.creditScores.mrCooper} size="small" />
                    </div>
                </Card>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card 
                title={
                    <div className="flex justify-between items-center w-full">
                        <span>Credit Cards</span>
                        <button onClick={handleSimulationClick} className="text-[10px] font-bold text-brand-primary bg-brand-light/20 px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all animate-pulse">
                            <SimulationIcon /> RUN SIMULATION*
                        </button>
                    </div>
                } 
                footerText={`Total Utilization: ${totalCardUtilization.toFixed(2)}%`}
            >
                <div className="space-y-4">
                {data.creditCards.map(card => {
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
                })}
                </div>
            </Card>
            <Card 
                title={
                    <div className="flex justify-between items-center w-full">
                        <span>Mortgages & Loans</span>
                        <button onClick={handleSimulationClick} className="text-[10px] font-bold text-brand-secondary bg-gray-100 dark:bg-gray-700/50 px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all">
                            <SimulationIcon /> PREDICT SCORE*
                        </button>
                    </div>
                } 
                footerText={`Total Utilization: ${totalLoanUtilization.toFixed(2)}%`}
            >
                <div className="space-y-4">
                    {data.loans.map(loan => {
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
                    })}
                </div>
            </Card>
        </div>
        
        <SimulationModal isOpen={isSimulationOpen} onClose={() => setIsSimulationOpen(false)} data={data} monthYear={monthYear} />
        <MembershipModal isOpen={isMembershipOpen} onClose={() => setIsMembershipOpen(false)} />
    </div>
  );
};

export default Dashboard;
