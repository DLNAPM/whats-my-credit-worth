
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import type { MonthlyData } from '../types';
import Button from './ui/Button';
import { SparklesIcon, AlertTriangleIcon, CheckIcon } from './ui/Icons';
import { formatMonthYear, formatCurrency, calculateMonthlyIncome, calculateTotal, calculateTotalBalance, calculateNetWorth, calculateDTI, calculateTotalLimit, calculateUtilization } from '../utils/helpers';

// Fix: Defining AIStudio interface to match existing global expectations
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

interface RecommendationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: MonthlyData;
  monthYear: string;
}

interface RecommendationItem {
  title: string;
  description: string;
  category: 'Debt Reduction' | 'Investment' | 'Life Insurance & Protection' | 'Strategic Move';
  actionItem: string;
}

const RecommendationsModal: React.FC<RecommendationsModalProps> = ({ isOpen, onClose, data, monthYear }) => {
  const [recommendations, setRecommendations] = useState<RecommendationItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsKey, setNeedsKey] = useState(false);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    setRecommendations(null);

    try {
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          setNeedsKey(true);
          setIsLoading(false);
          return;
        }
      } else if (!process.env.API_KEY) {
        setError("API configuration missing. Please ensure the 'API_KEY' environment variable is set in your hosting provider (Render or Firebase).");
        setIsLoading(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const netWorth = calculateNetWorth(data);
      const totalIncome = calculateMonthlyIncome(data.income.jobs);
      const totalBills = calculateTotal(data.monthlyBills);
      const cardBalance = calculateTotalBalance(data.creditCards);
      const cardLimit = calculateTotalLimit(data.creditCards);
      const utilization = calculateUtilization(cardBalance, cardLimit);
      const loanBalance = calculateTotalBalance(data.loans);
      const totalDebt = cardBalance + loanBalance;
      const dti = calculateDTI(totalBills, totalIncome);
      const scores = `Experian: ${data.creditScores.experian.score8}, Equifax: ${data.creditScores.equifax.score8}, TransUnion: ${data.creditScores.transunion.score8}`;

      const schema = {
        type: Type.OBJECT,
        properties: {
          recommendations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                category: { 
                  type: Type.STRING,
                  enum: ['Debt Reduction', 'Investment', 'Life Insurance & Protection', 'Strategic Move']
                },
                actionItem: { type: Type.STRING }
              },
              required: ['title', 'description', 'category', 'actionItem']
            }
          }
        },
        required: ['recommendations']
      };

      const prompt = `You are a high-end personal wealth manager. Provide 4 tailored, data-driven financial strategies for ${formatMonthYear(monthYear)} based on:
        - Net Worth: ${formatCurrency(netWorth)}
        - Monthly Gross Income: ${formatCurrency(totalIncome)}
        - Total Liabilities: ${formatCurrency(totalDebt)}
        - Credit Card Utilization: ${utilization.toFixed(1)}%
        - Debt-to-Income Ratio: ${dti.toFixed(1)}%
        - FICO Scores: ${scores}

        REQUIREMENTS:
        1. "Debt Reduction": Analyze their specific loan/CC balance and suggest a payoff or refinancing move (e.g., Consolidation, 0% APR Transfer).
        2. "Investment": Recommend a wealth-building vehicle (e.g., Roth IRA, Brokerage, Real Estate) based on their current cash flow and net worth.
        3. "Life Insurance & Protection": Evaluate if they need Term/Whole Life, Disability, or an Umbrella policy based on their income and debt footprint.
        4. "Strategic Move": A custom move to optimize their credit worthiness or tax efficiency.

        Format: Professional, actionable, and encouraging. Use JSON response.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
          thinkingConfig: { thinkingBudget: 32768 }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.recommendations) setRecommendations(parsed.recommendations);

    } catch (err: any) {
      console.error("Gemini Error:", err);
      if (err.message?.includes("Requested entity was not found") || err.message?.includes("API Key must be set")) {
        if (window.aistudio) {
          setNeedsKey(true);
        } else {
          setError("The API Key provided is invalid or has expired. Please check your Render/Firebase environment variables.");
        }
      } else {
        setError("Failed to generate tailored insights. Please verify your internet connection or check API logs.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setNeedsKey(false);
      fetchRecommendations();
    }
  };

  useEffect(() => {
    if (isOpen) fetchRecommendations();
  }, [isOpen, monthYear]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col border border-purple-100 dark:border-purple-900/30">
        <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-purple-50 to-white dark:from-purple-900/10 dark:to-gray-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-xl"><SparklesIcon /></div>
            <div>
              <h2 className="text-xl font-bold text-purple-900 dark:text-purple-100">Tailored Advisor</h2>
              <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Unique Financial Footprint Analysis</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-grow">
          {needsKey ? (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
              <div className="w-16 h-16 bg-purple-50 dark:bg-purple-900/20 rounded-full flex items-center justify-center"><SparklesIcon /></div>
              <h3 className="text-lg font-bold">Connect AI Engine</h3>
              <p className="text-sm text-gray-500 max-w-xs">To generate tailored recommendations, you must connect a valid Gemini API key from Google AI Studio.</p>
              <a 
                href="https://ai.google.dev/gemini-api/docs/billing" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-xs text-purple-600 hover:underline mb-2"
              >
                Learn about Gemini API billing
              </a>
              <Button onClick={handleSelectKey}>Select API Key</Button>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-5">
              <div className="w-12 h-12 border-4 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
              <p className="text-lg font-semibold animate-pulse text-purple-700">Analyzing footprint...</p>
              <p className="text-sm text-gray-500 max-w-xs text-center">We're correlating your income, debt ratios, and credit history to find growth opportunities.</p>
            </div>
          ) : error ? (
            <div className="p-6 bg-red-50 dark:bg-red-900/10 border border-red-200 rounded-xl text-center space-y-4">
              <div className="flex justify-center"><AlertTriangleIcon /></div>
              <p className="text-sm text-red-800 dark:text-red-200 font-medium">{error}</p>
              <Button onClick={fetchRecommendations} variant="secondary" size="small">Try Again</Button>
            </div>
          ) : recommendations ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-brand-primary/5 to-purple-50 p-4 rounded-xl mb-4 border border-brand-primary/10">
                <p className="text-sm text-brand-primary font-medium">
                  We've identified 4 high-impact opportunities for your <strong>{formatMonthYear(monthYear)}</strong> footprint.
                </p>
              </div>
              {recommendations.map((rec, idx) => (
                <div key={idx} className="p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm hover:border-purple-300 transition-all group">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded shadow-sm ${
                      rec.category === 'Debt Reduction' ? 'bg-red-50 text-red-600 border border-red-100' :
                      rec.category === 'Investment' ? 'bg-green-50 text-green-600 border border-green-100' :
                      rec.category === 'Life Insurance & Protection' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                      'bg-purple-50 text-purple-600 border border-purple-100'
                    }`}>
                      {rec.category}
                    </span>
                  </div>
                  <h4 className="font-bold mb-1 text-gray-900 dark:text-white group-hover:text-purple-700 transition-colors">{rec.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">{rec.description}</p>
                  <div className="flex items-center gap-2 text-xs font-bold text-positive bg-green-50/50 dark:bg-green-900/10 p-2 rounded-lg border border-green-100 dark:border-green-900/20">
                    <CheckIcon /> <span>NEXT STEP: {rec.actionItem}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="p-4 border-t bg-gray-50 dark:bg-gray-800/50 flex justify-end">
          <Button onClick={onClose} variant="secondary" size="small">Close Advisor</Button>
        </div>
      </div>
    </div>
  );
};

export default RecommendationsModal;
