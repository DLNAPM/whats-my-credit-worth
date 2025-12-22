
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import type { MonthlyData } from '../types';
import Button from './ui/Button';
import { SparklesIcon, AlertTriangleIcon, CheckIcon } from './ui/Icons';
import { formatMonthYear, formatCurrency, calculateMonthlyIncome, calculateTotal, calculateTotalBalance, calculateNetWorth, calculateDTI } from '../utils/helpers';

interface RecommendationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: MonthlyData;
  monthYear: string;
}

interface RecommendationItem {
  title: string;
  description: string;
  category: string;
  actionItem: string;
}

const RecommendationsModal: React.FC<RecommendationsModalProps> = ({ isOpen, onClose, data, monthYear }) => {
  const [recommendations, setRecommendations] = useState<RecommendationItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsKey, setNeedsKey] = useState(false);

  const checkKeyStatus = async () => {
    const aistudio = (window as any).aistudio;
    
    // Check if key is available in environment or via selection
    if (aistudio && typeof aistudio.hasSelectedApiKey === 'function') {
      try {
        const hasKey = await aistudio.hasSelectedApiKey();
        // If no selected key AND no hardcoded environment key, we need a key
        if (!hasKey && !process.env.API_KEY) {
          setNeedsKey(true);
          return;
        }
      } catch (err) {
        console.warn("AI Studio key check skipped:", err);
      }
    }
    
    // Proceed to fetch; internal logic handles missing process.env.API_KEY
    fetchRecommendations();
  };

  const handleOpenKeyDialog = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio && typeof aistudio.openSelectKey === 'function') {
      try {
        await aistudio.openSelectKey();
        setNeedsKey(false);
        fetchRecommendations();
      } catch (err) {
        console.error("Failed to open key dialog:", err);
      }
    }
  };

  const fetchRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    setRecommendations(null);

    try {
      // Defensive check for the API key to avoid the "API Key must be set" SDK crash
      const apiKey = process.env.API_KEY;
      if (!apiKey) {
          // If we are in AI Studio, trigger the key selector
          if ((window as any).aistudio) {
              setNeedsKey(true);
              setIsLoading(false);
              return;
          }
          // Otherwise, it's a hosting configuration error (e.g. Render.com)
          throw new Error("API_KEY_MISSING");
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const netWorth = calculateNetWorth(data);
      const totalIncome = calculateMonthlyIncome(data.income.jobs);
      const totalBills = calculateTotal(data.monthlyBills);
      const totalDebt = calculateTotalBalance(data.creditCards) + calculateTotalBalance(data.loans);
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
                category: { type: Type.STRING, description: "Must be one of: 'Credit Cards', 'Loans', 'Savings', 'Investments', 'General'" },
                actionItem: { type: Type.STRING, description: "A very short actionable step (max 15 words)." }
              },
              required: ['title', 'description', 'category', 'actionItem']
            }
          }
        },
        required: ['recommendations']
      };

      const prompt = `
        Analyze this financial profile for ${formatMonthYear(monthYear)} and provide 4 strategic recommendations.
        Profile:
        - Net Worth: ${formatCurrency(netWorth)}
        - Income: ${formatCurrency(totalIncome)}
        - DTI: ${dti.toFixed(1)}%
        - Debt: ${formatCurrency(totalDebt)}
        - Scores: ${scores}
        Assets: ${data.assets.map(a => `${a.name}(${formatCurrency(a.value)})`).join(', ')}
        
        Focus on credit health, debt-to-income optimization, and net worth growth.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
          thinkingConfig: { thinkingBudget: 32768 } // Gemini 3 Pro reasoning depth
        }
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text);
        if (parsed.recommendations) {
          setRecommendations(parsed.recommendations);
        }
      }
    } catch (err: any) {
      console.error("AI Advisor Error:", err);
      
      if (err.message === "API_KEY_MISSING" || err.message?.includes("API Key must be set")) {
          setError("The AI Advisor is not configured correctly. Please ensure the API_KEY environment variable is set in your hosting settings (e.g., Render Dashboard) and that it is accessible to the frontend application.");
      } else if (err.message?.includes("403") || err.message?.includes("401")) {
          setNeedsKey(true);
      } else {
          setError("We couldn't analyze your snapshot right now. Please check your internet connection and try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkKeyStatus();
    }
  }, [isOpen, monthYear]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col border border-purple-100 dark:border-purple-900/30">
        <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-purple-50 to-white dark:from-purple-900/10 dark:to-gray-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-xl">
              <SparklesIcon />
            </div>
            <div>
              <h2 className="text-xl font-bold text-purple-900 dark:text-purple-100">AI Advice</h2>
              <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Financial Reasoning Engine</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
             <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-grow custom-scrollbar">
          {needsKey ? (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-6">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center"><SparklesIcon /></div>
              <div className="max-w-xs">
                <h3 className="text-lg font-bold mb-2">Connect to Gemini</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Personalized advice requires a connection to the Gemini 3 Pro reasoning model.</p>
              </div>
              <Button onClick={handleOpenKeyDialog} className="w-full sm:w-auto">Select API Key</Button>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-5">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-purple-100 dark:border-purple-900/30 rounded-full"></div>
                <div className="absolute top-0 w-12 h-12 border-4 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">Analyzing Your Finances...</p>
                <p className="text-sm text-gray-400 animate-pulse">Running deep reasoning snapshot</p>
              </div>
            </div>
          ) : error ? (
            <div className="p-6 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl text-center space-y-4">
              <div className="flex justify-center text-negative"><AlertTriangleIcon /></div>
              <div className="max-w-sm mx-auto">
                <h4 className="font-bold text-negative">Configuration Required</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">{error}</p>
              </div>
              <Button onClick={fetchRecommendations} variant="secondary" size="small">Try Again</Button>
            </div>
          ) : recommendations ? (
            <div className="space-y-4">
              {recommendations.map((rec, idx) => (
                <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50 rounded-2xl hover:border-purple-200 dark:hover:border-purple-800 transition-all">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded mb-2 inline-block">
                    {rec.category}
                  </span>
                  <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-1">{rec.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">{rec.description}</p>
                  <div className="flex items-center gap-2 text-xs font-bold text-positive bg-green-50 dark:bg-green-900/20 p-2 rounded-xl border border-green-100 dark:border-green-900/30">
                    <CheckIcon /> <span>{rec.actionItem}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="p-4 border-t bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-2">
            {!isLoading && recommendations && (
                <Button onClick={fetchRecommendations} variant="secondary" size="small">Refresh Advice</Button>
            )}
            <Button onClick={onClose} variant="secondary" size="small">Close</Button>
        </div>
      </div>
    </div>
  );
};

export default RecommendationsModal;
