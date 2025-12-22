
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
        if (!hasKey && !process.env.API_KEY) {
          setNeedsKey(true);
          return;
        }
      } catch (err) {
        console.warn("AI Studio key check skipped:", err);
      }
    }
    
    // If we have a key or can't check, proceed with fetch
    fetchRecommendations();
  };

  const handleOpenKeyDialog = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio && typeof aistudio.openSelectKey === 'function') {
      await aistudio.openSelectKey();
      setNeedsKey(false);
      // We assume selection success and proceed
      fetchRecommendations();
    }
  };

  const fetchRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    setRecommendations(null);

    try {
      // Create a fresh instance to ensure we use the latest selected key
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const netWorth = calculateNetWorth(data);
      const totalIncome = calculateMonthlyIncome(data.income.jobs);
      const totalBills = calculateTotal(data.monthlyBills);
      const totalDebt = calculateTotalBalance(data.creditCards) + calculateTotalBalance(data.loans);
      const dti = calculateDTI(totalBills, totalIncome);

      // Extract scores cleanly
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
                category: { type: Type.STRING, description: "One of: 'Credit Cards', 'Loans', 'Savings', 'Investments', 'General'" },
                actionItem: { type: Type.STRING, description: "A short, actionable step (max 15 words)." }
              },
              required: ['title', 'description', 'category', 'actionItem']
            }
          }
        },
        required: ['recommendations']
      };

      const prompt = `
        As an expert financial advisor for "What's my Credit Worth", analyze this financial snapshot for ${formatMonthYear(monthYear)} and provide 4 high-impact recommendations.
        
        FINANCIAL PROFILE:
        - Net Worth: ${formatCurrency(netWorth)}
        - Monthly Income: ${formatCurrency(totalIncome)}
        - Monthly Bills: ${formatCurrency(totalBills)}
        - Total Debt: ${formatCurrency(totalDebt)}
        - Debt-to-Income (DTI): ${dti.toFixed(2)}%
        - FICO 8 Scores: ${scores}
        
        ASSETS: ${data.assets.map(a => `${a.name}: ${formatCurrency(a.value)}`).join(', ')}
        DEBT BREAKDOWN: ${[...data.creditCards, ...data.loans].map(d => `${d.name}: ${formatCurrency(d.balance)} balance / ${formatCurrency(d.limit)} limit`).join(', ')}

        Analyze for:
        1. Credit score improvement (utilization focus).
        2. Debt reduction prioritization.
        3. Savings or investment opportunities.
        4. General budget health (DTI).

        Return strictly valid JSON matching the provided schema.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
          thinkingConfig: { thinkingBudget: 32768 } // Max budget for pro
        }
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text);
        if (parsed.recommendations) {
          setRecommendations(parsed.recommendations);
        } else {
          throw new Error("Invalid response format");
        }
      }
    } catch (err: any) {
      console.error("Gemini API Error:", err);
      // Check for common key errors
      const msg = err.message || "";
      if (msg.includes('API_KEY') || msg.includes('API key') || msg.includes('403') || msg.includes('401') || msg.includes('not set')) {
        setNeedsKey(true);
      } else {
        setError("Failed to analyze data. Please try again.");
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
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-purple-50 to-white dark:from-purple-900/10 dark:to-gray-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-xl">
              <SparklesIcon />
            </div>
            <div>
              <h2 className="text-xl font-bold text-purple-900 dark:text-purple-100">AI Financial Advisor</h2>
              <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">{formatMonthYear(monthYear)} Analysis</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
             <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto flex-grow custom-scrollbar">
          {needsKey ? (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-6">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <SparklesIcon />
              </div>
              <div className="max-w-xs">
                <h3 className="text-lg font-bold mb-2">Connect AI Advisor</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  To receive personalized financial advice, you need to connect your Gemini API key.
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  (Required for Gemini 3 Pro models)
                </p>
              </div>
              <Button onClick={handleOpenKeyDialog} className="w-full sm:w-auto">
                Select API Key
              </Button>
              <a 
                href="https://ai.google.dev/gemini-api/docs/billing" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-brand-primary hover:underline"
              >
                Learn about API keys
              </a>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-5">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-purple-100 dark:border-purple-900/30 rounded-full"></div>
                <div className="absolute top-0 w-12 h-12 border-4 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                   <SparklesIcon />
                </div>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">Analyzing Snapshot...</p>
                <p className="text-sm text-gray-400 animate-pulse">Running complex reasoning with Gemini 3 Pro</p>
              </div>
            </div>
          ) : error ? (
            <div className="p-6 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl text-center space-y-4">
              <div className="flex justify-center text-negative">
                <AlertTriangleIcon />
              </div>
              <div>
                <h4 className="font-bold text-negative">Analysis Interrupted</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{error}</p>
              </div>
              <Button onClick={fetchRecommendations} variant="secondary" size="small">Try Again</Button>
            </div>
          ) : recommendations ? (
            <div className="space-y-4">
              {recommendations.map((rec, idx) => (
                <div 
                  key={idx} 
                  className="group p-4 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50 rounded-2xl hover:border-purple-200 dark:hover:border-purple-800 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded">
                      {rec.category}
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-1">{rec.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                    {rec.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs font-bold text-positive bg-green-50 dark:bg-green-900/20 p-2 rounded-xl border border-green-100 dark:border-green-900/30">
                    <CheckIcon />
                    <span>{rec.actionItem}</span>
                  </div>
                </div>
              ))}
              
              <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                 <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                   <strong>Pro Tip:</strong> These insights are based on your current Debt-to-Income ratio (${calculateDTI(calculateTotal(data.monthlyBills), calculateMonthlyIncome(data.income.jobs)).toFixed(1)}%) and credit utilization. Update your data monthly to track improvements.
                 </p>
              </div>
            </div>
          ) : (
             <div className="text-center py-10 text-gray-500">
               Click refresh to generate advice.
             </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 dark:bg-gray-800/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[10px] text-gray-400 dark:text-gray-500 italic text-center sm:text-left max-w-[70%]">
            AI-generated advice is for informational purposes only. Consult with a professional financial advisor for specific investment or debt strategies.
          </p>
          <div className="flex gap-2">
            {!needsKey && !isLoading && (
              <Button onClick={fetchRecommendations} variant="secondary" size="small">
                Refresh
              </Button>
            )}
            <Button onClick={onClose} variant="secondary" size="small">Close</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecommendationsModal;
