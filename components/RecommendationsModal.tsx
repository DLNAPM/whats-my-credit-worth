
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import type { MonthlyData } from '../types';
import Button from './ui/Button';
import { SparklesIcon } from './ui/Icons';
import { formatMonthYear, formatCurrency, calculateMonthlyIncome, calculateTotal, calculateTotalBalance, calculateNetWorth, calculateDTI } from '../utils/helpers';

interface RecommendationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: MonthlyData;
  monthYear: string;
}

const RecommendationsModal: React.FC<RecommendationsModalProps> = ({ isOpen, onClose, data, monthYear }) => {
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to generate content from Gemini API
  const generateRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Use the injected API_KEY from environment variables
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const netWorth = calculateNetWorth(data);
      const totalIncome = calculateMonthlyIncome(data.income.jobs);
      const totalBills = calculateTotal(data.monthlyBills);
      const totalAssets = calculateTotal(data.assets);
      const totalDebt = calculateTotalBalance(data.creditCards) + calculateTotalBalance(data.loans);
      const dti = calculateDTI(totalBills, totalIncome);

      const prompt = `
        As an expert financial advisor, provide 3-5 personalized, actionable recommendations based on the following financial snapshot for ${formatMonthYear(monthYear)}:
        
        - Net Worth: ${formatCurrency(netWorth)}
        - Monthly Income: ${formatCurrency(totalIncome)}
        - Total Monthly Bills: ${formatCurrency(totalBills)}
        - Total Assets: ${formatCurrency(totalAssets)}
        - Total Debt: ${formatCurrency(totalDebt)}
        - Debt-to-Income (DTI) Ratio: ${dti.toFixed(2)}%
        
        Details:
        - Income Sources: ${data.income.jobs.map(j => `${j.name} (${formatCurrency(j.amount)} ${j.frequency})`).join(', ')}
        - Credit Cards: ${data.creditCards.map(c => `${c.name}: Balance ${formatCurrency(c.balance)}, Limit ${formatCurrency(c.limit)}`).join(', ')}
        - Loans: ${data.loans.map(l => `${l.name}: Balance ${formatCurrency(l.balance)}, Limit ${formatCurrency(l.limit)}`).join(', ')}
        - Assets: ${data.assets.map(a => `${a.name}: Value ${formatCurrency(a.value)}`).join(', ')}
        - Monthly Bills: ${data.monthlyBills.map(b => `${b.name}: ${formatCurrency(b.amount)}`).join(', ')}
        - Credit Scores: Experian (${data.creditScores.experian.score8}), Equifax (${data.creditScores.equifax.score8}), TransUnion (${data.creditScores.transunion.score8})

        Please format the output in Markdown. Focus on improving credit health, reducing debt, and optimizing savings.
      `;

      // Using gemini-3-pro-preview for complex reasoning task
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 4000 }
        }
      });

      // Extracting text output directly from the response object
      setRecommendation(response.text || "Could not generate recommendations at this time.");
    } catch (err: any) {
      console.error("Gemini API Error:", err);
      setError("Failed to fetch recommendations. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger recommendation generation when modal opens if not already loaded
  useEffect(() => {
    if (isOpen && !recommendation && !isLoading && data) {
      generateRecommendations();
    }
  }, [isOpen, data, recommendation, isLoading]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b flex items-center justify-between bg-purple-50 dark:bg-purple-900/20">
          <div className="flex items-center gap-2">
            <SparklesIcon />
            <h2 className="text-2xl font-bold text-purple-900 dark:text-purple-100">AI Financial Recommendations</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
          </button>
        </div>
        
        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-grow prose dark:prose-invert max-w-none">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
              <p className="text-gray-600 dark:text-gray-400 animate-pulse">Analyzing your financial data...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
              <p>{error}</p>
              <Button onClick={generateRecommendations} variant="danger" className="mt-4">Try Again</Button>
            </div>
          ) : (
            <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">
              {recommendation}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t bg-gray-50 dark:bg-gray-800/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 italic text-center sm:text-left">
            Disclaimer: These recommendations are generated by AI and are for informational purposes only. Consult with a professional financial advisor for specific advice.
          </p>
          <Button onClick={onClose} variant="secondary">Close</Button>
        </div>
      </div>
    </div>
  );
};

export default RecommendationsModal;
