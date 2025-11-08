import React, { useState } from 'react';
import type { MonthlyData } from '../types';
import { calculateNetWorth, formatCurrency, calculateMonthlyIncome, formatMonthYear } from '../utils/helpers';
import Button from './ui/Button';
import { CopyIcon } from './ui/Icons';
import Card from './ui/Card';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: MonthlyData;
  monthYear: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, data, monthYear }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !data) return null;

  const netWorth = calculateNetWorth(data);
  const monthlyIncome = calculateMonthlyIncome(data.income.jobs);

  const summaryText = `
My Financial Snapshot for ${formatMonthYear(monthYear)}:
- Net Worth: ${formatCurrency(netWorth)}
- Monthly Income: ${formatCurrency(monthlyIncome)}
- Total Assets: ${formatCurrency(data.assets.reduce((sum, a) => sum + a.value, 0))}
- Total Debt: ${formatCurrency(data.creditCards.reduce((s, c) => s + c.balance, 0) + data.loans.reduce((s, l) => s + l.balance, 0))}
  `.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-lg">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold">Share Your Financial Snapshot</h2>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-gray-600 dark:text-gray-300">Here's a text summary of your financial data for {formatMonthYear(monthYear)}. You can copy it to your clipboard.</p>
          <Card title="Summary">
            <pre className="whitespace-pre-wrap p-4 bg-gray-100 dark:bg-gray-800 rounded text-sm">{summaryText}</pre>
          </Card>
        </div>
        <div className="p-6 flex justify-end gap-4 bg-gray-50 dark:bg-gray-800/50">
          <Button onClick={onClose} variant="secondary">Close</Button>
          <Button onClick={handleCopy}>
            <CopyIcon />
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
