
import React, { useState, useMemo } from 'react';
import type { FinancialData } from '../types';
import { formatMonthYear, calculateNetWorth, formatCurrency } from '../utils/helpers';
import Card from './ui/Card';

type ReportType = 'monthly' | 'quarterly' | 'annual';

const Reports: React.FC<{ allData: FinancialData }> = ({ allData }) => {
  const [reportType, setReportType] = useState<ReportType>('monthly');
  const monthYears = useMemo(() => Object.keys(allData).sort().reverse(), [allData]);

  if (monthYears.length < 2) {
    return (
        <Card title="Comparison Reports">
            <div className="text-center py-10">
                <h2 className="text-xl font-semibold">Not enough data for comparison.</h2>
                <p className="text-gray-500">You need at least two months of data to generate a report.</p>
            </div>
      </Card>
    );
  }
  
  const getComparisonData = () => {
    const comparisons: any[] = [];
    for (let i = 0; i < monthYears.length - 1; i++) {
        const currentMonthYear = monthYears[i];
        let prevMonthYear: string | undefined;

        if (reportType === 'monthly') {
            prevMonthYear = monthYears[i+1];
        } else if (reportType === 'quarterly') {
            const date = new Date(currentMonthYear + "-01T12:00:00Z");
            date.setMonth(date.getMonth() - 3);
            const target = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            prevMonthYear = monthYears.find(my => my === target);
        } else if (reportType === 'annual') {
            const date = new Date(currentMonthYear + "-01T12:00:00Z");
            date.setFullYear(date.getFullYear() - 1);
            const target = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            prevMonthYear = monthYears.find(my => my === target);
        }

        if (prevMonthYear) {
            const currentData = allData[currentMonthYear];
            const prevData = allData[prevMonthYear];

            const currentNetWorth = calculateNetWorth(currentData);
            const prevNetWorth = calculateNetWorth(prevData);
            const change = currentNetWorth - prevNetWorth;
            
            comparisons.push({
                period: `${formatMonthYear(prevMonthYear, 'short')} vs ${formatMonthYear(currentMonthYear, 'short')}`,
                currentNetWorth,
                prevNetWorth,
                change
            });
        }
    }
    return comparisons;
  }
  
  const comparisonData = getComparisonData();

  return (
    <Card title="Comparison Reports">
      <div className="flex justify-center mb-6">
        <div className="flex items-center bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
          {(['monthly', 'quarterly', 'annual'] as ReportType[]).map(type => (
            <button
              key={type}
              onClick={() => setReportType(type)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize ${
                reportType === type
                  ? 'bg-brand-primary text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-brand-light hover:text-brand-primary'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

        {comparisonData.length > 0 ? (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Period</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">End Net Worth</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Start Net Worth</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Change</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {comparisonData.map((item, index) => (
                        <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{item.period}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{formatCurrency(item.currentNetWorth)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{formatCurrency(item.prevNetWorth)}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${item.change >= 0 ? 'text-positive' : 'text-negative'}`}>
                            {item.change >= 0 ? '+' : ''}{formatCurrency(item.change)}
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        ) : (
             <div className="text-center py-10">
                <h2 className="text-xl font-semibold">No comparable data found for this period type.</h2>
                <p className="text-gray-500">Try selecting a different report type or add more data.</p>
            </div>
        )}
    </Card>
  );
};

export default Reports;
