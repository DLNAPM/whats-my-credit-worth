
import React from 'react';
import type { MonthlyData } from '../types';
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
  formatMonthYear
} from '../utils/helpers';
import Card from './ui/Card';
import Metric from './ui/Metric';

interface SnapshotProps {
  snapshotData: {
    monthYear: string;
    data: MonthlyData;
  };
}

const ProgressBar: React.FC<{ value: number }> = ({ value }) => {
  const utilization = Math.min(Math.max(value, 0), 100);
  const colorClass = utilization > 70 ? 'bg-red-500' : utilization > 30 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
      <div className={`${colorClass} h-2.5 rounded-full`} style={{ width: `${utilization}%` }}></div>
    </div>
  );
};


const Snapshot: React.FC<SnapshotProps> = ({ snapshotData }) => {
  const { monthYear, data } = snapshotData;

  const netWorth = calculateNetWorth(data);
  const totalIncome = calculateMonthlyIncome(data.income.jobs);
  const totalBills = calculateTotal(data.monthlyBills);
  const totalAssets = calculateTotal(data.assets);
  const totalDebt = calculateTotalBalance(data.creditCards) + calculateTotalBalance(data.loans);
  
  const totalCardBalance = calculateTotalBalance(data.creditCards);
  const totalCardLimit = calculateTotalLimit(data.creditCards);
  const totalCardUtilization = calculateUtilization(totalCardBalance, totalCardLimit);

  const totalLoanBalance = calculateTotalBalance(data.loans);
  const totalLoanLimit = calculateTotalLimit(data.loans);
  const totalLoanUtilization = calculateUtilization(totalLoanBalance, totalLoanLimit);

  const dti = calculateDTI(totalBills, totalIncome);
  const getDtiStatus = (dtiValue: number): 'positive' | 'negative' | undefined => {
    if (dtiValue <= 36) return 'positive';
    if (dtiValue > 43) return 'negative';
    return undefined;
  };
  const dtiStatus = getDtiStatus(dti);

  return (
    <div className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen font-sans">
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <header className="bg-white dark:bg-gray-800 shadow-md p-4 mb-6 rounded-lg text-center">
                 <h1 className="text-2xl font-bold text-brand-primary dark:text-brand-light">What's My Credit Worth?</h1>
                 <p className="text-gray-600 dark:text-gray-400 mt-1">Read-Only Financial Snapshot for {formatMonthYear(monthYear)}</p>
            </header>
            <main className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    <Metric label="Net Worth" value={formatCurrency(netWorth)} change={netWorth > 0 ? 'positive' : 'negative'} />
                    <Metric label="Total Assets" value={formatCurrency(totalAssets)} />
                    <Metric label="Total Debt" value={formatCurrency(totalDebt)} change="negative" />
                    <Metric label="Monthly Income" value={formatCurrency(totalIncome)} change="positive" />
                    <Metric label="DTI Ratio" value={`${dti.toFixed(2)}%`} change={dtiStatus} />
                </div>
                
                <Card title="Credit Scores">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <Metric label="Experian FICO 8" value={data.creditScores.experian.score8} size="small" />
                        <Metric label="Equifax FICO 8" value={data.creditScores.equifax.score8} size="small" />
                        <Metric label="TransUnion FICO 8" value={data.creditScores.transunion.score8} size="small" />
                        <Metric label="Mr. Cooper FICO 4" value={data.creditScores.mrCooper} size="small" />
                        <Metric label="Lending Tree" value={data.creditScores.lendingTree} size="small" />
                        <Metric label="Credit Karma" value={data.creditScores.creditKarma} size="small" />
                        <Metric label="Credit Sesame" value={data.creditScores.creditSesame} size="small" />
                    </div>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card title="Credit Cards" footerText={`Total Utilization: ${totalCardUtilization.toFixed(2)}%`}>
                        <div className="space-y-4">
                        {data.creditCards.map(card => {
                            const utilization = calculateUtilization(card.balance, card.limit);
                            return (
                                <div key={card.id}>
                                    <div className="flex justify-between items-center mb-1 text-sm">
                                        <span className="font-semibold">{card.name}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-500 dark:text-gray-400">{formatCurrency(card.balance)} / {formatCurrency(card.limit)}</span>
                                            <span className={`font-bold ${getUtilizationColor(utilization)}`}>{utilization.toFixed(2)}%</span>
                                        </div>
                                    </div>
                                    <ProgressBar value={utilization} />
                                </div>
                            );
                        })}
                        </div>
                    </Card>
                    <Card title="Mortgages & Loans" footerText={`Total Utilization: ${totalLoanUtilization.toFixed(2)}%`}>
                        <div className="space-y-4">
                            {data.loans.map(loan => {
                                const utilization = calculateUtilization(loan.balance, loan.limit);
                                return (
                                    <div key={loan.id}>
                                        <div className="flex justify-between items-center mb-1 text-sm">
                                            <span className="font-semibold">{loan.name}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-500 dark:text-gray-400">{formatCurrency(loan.balance)} / {formatCurrency(loan.limit)}</span>
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

                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card title="Assets">
                        <ul className="space-y-2 text-sm">
                            {data.assets.map(asset => (
                                <li key={asset.id} className="flex justify-between">
                                    <span>{asset.name}</span>
                                    <span className="font-semibold">{formatCurrency(asset.value)}</span>
                                </li>
                            ))}
                            <li className="flex justify-between border-t pt-2 mt-2 font-bold text-base">
                                <span>Total Assets</span>
                                <span>{formatCurrency(totalAssets)}</span>
                            </li>
                        </ul>
                    </Card>
                    <Card title="Income">
                        <div className="space-y-2 text-sm">
                            <div className="grid grid-cols-3 gap-4 font-semibold text-gray-500 dark:text-gray-400 pb-2 border-b">
                                <span className="col-span-1">Source</span>
                                <span className="text-center">Frequency</span>
                                <span className="text-right">Amount</span>
                            </div>
                            <ul className="space-y-2">
                                {data.income.jobs.map(job => (
                                    <li key={job.id} className="grid grid-cols-3 gap-4 items-center">
                                        <span className="col-span-1 truncate">{job.name}</span>
                                        <span className="text-center capitalize">{job.frequency.replace('-', ' ')}</span>
                                        <span className="font-semibold text-right">{formatCurrency(job.amount)}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="flex justify-between border-t pt-2 mt-2 font-bold text-base">
                                <span>Total Monthly Income</span>
                                <span>{formatCurrency(totalIncome)}</span>
                            </div>
                        </div>
                    </Card>
                    <Card title="Monthly Bills">
                        <ul className="space-y-2 text-sm">
                            {data.monthlyBills.map(bill => (
                                <li key={bill.id} className="flex justify-between">
                                    <span>{bill.name}</span>
                                    <span className="font-semibold">{formatCurrency(bill.amount)}</span>
                                </li>
                            ))}
                            <li className="flex justify-between border-t pt-2 mt-2 font-bold text-base">
                                <span>Total Bills</span>
                                <span>{formatCurrency(totalBills)}</span>
                            </li>
                        </ul>
                    </Card>
                </div>
            </main>
            <footer className="text-center mt-8 text-sm text-gray-500">
                <p>
                    <a href="/" className="text-brand-primary hover:underline">Return to the main application</a>
                </p>
            </footer>
        </div>
    </div>
  );
};

export default Snapshot;